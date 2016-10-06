import fuse from 'fuse-bindings'
import fs from 'fs-promise'
import {RemoteHandlerLocal} from '@nraynaud/xo-fs'
import {Vhd} from './vhd'

console.log('starting vhd-mount')


function mountIt (dir, vhd) {
  console.log('mountIt', dir)
  fuse.mount(dir, {
    error: function (error) {
      console.log('error', error)
    },
    init: function (cb) {
      console.log('init')
      process.on('SIGINT', function () {
        fuse.unmount(dir, function () {
          process.exit()
        })
      })
      cb(0)
      setTimeout(()=> {
        fs.stat(dir + '/disk').then(stats => {
          console.log(stats)
        })
      }, 1)
    },
    statfs: function (path, cb) {
      console.log('statfs(%s)', path)
      cb(0, {})
    },
    readdir: function (path, cb) {
      console.log('readdir(%s)', path)
      if (path === '/') return cb(0, ['disk'])
      cb(0)
    },
    getattr: function (path, cb) {
      console.log('getattr(%s)', path)
      if (path === '/') {
        cb(0, {
          mtime: new Date(),
          atime: new Date(),
          ctime: new Date(),
          size: 100,
          mode: parseInt('40000', 8) + parseInt('0444', 8),
          uid: process.getuid(),
          gid: process.getgid()
        })
        return
      }
      if (path === '/disk') {
        const diskSize = vhd.footer.currentSize.high * Math.pow(2, 32) + vhd.footer.currentSize.low;
        cb(0, {
          nlink: 1,
          mtime: new Date(),
          atime: new Date(),
          ctime: new Date(),
          size: diskSize,
          mode: parseInt('100000', 8) + parseInt('0444', 8),
          uid: process.getuid(),
          gid: process.getgid()
        })
        return
      }

      cb(fuse.ENOENT)
    },
    open: function (path, flags, cb) {
      console.log('open(%s, %d)', path, flags)
      cb(0, 42) // 42 is an fd
    },
    read: function (path, fd, buf, len, pos, cb) {
      console.log('read(%s, %d, %d)', path, pos, len)
      const blockSizeBytes = vhd.sectorsPerBlock * 512
      const posInBlock = pos % blockSizeBytes
      const tableEntry = Math.floor(pos / blockSizeBytes)
      const blockAddress = vhd.header.maxTableEntries > tableEntry ? vhd.readAllocationTableEntry() : 0xFFFFFFFF
      if (blockAddress !== 0xFFFFFFFF) {
        console.log('blockAddress', blockAddress);
        var actualLen = Math.min(len, blockSizeBytes - posInBlock);
        vhd.readBlockData(blockAddress).then(function (block) {
          console.log('read', block.length);
          block.copy(buf, 0, posInBlock, posInBlock + actualLen);
          return cb(actualLen);
        }).catch(function (error) {
          return console.log(error, error['stack'] ? error.stack : '');
        });
      } else {
        console.log('blockAddress is 0xFFFFFFFF');
        buf.fill(0, 0, len)
        return cb(len)
      }
    }
  })
}

console.log(process.argv);
var filePath = process.argv[2];

async function run (mountPoint, file) {
  const stats = await fs.stat(filePath)
  console.log(stats)
  let vhd = new Vhd(new RemoteHandlerLocal({ url: 'file://' + process.cwd() }), filePath)
  await vhd.readHeaderAndFooter()
  await vhd.readBlockTable()
  try {
    await fs.mkdir(mountPoint)
    mountIt(mountPoint, vhd)
  } catch (error) {
    if (error.code === 'EEXIST') {
      mountIt(mountPoint, vhd)
    }
    else
      throw error
  }
}


run('mntPoint', filePath).catch((error) => console.log(error, error.stack()))

