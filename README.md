# xo-vhdimount
> Node.js lib for mounting VHDI files as raw disk files

## Usage
```
> sudo node dist/index.js file.vhd
```

This will create a directory "mntPoint" and a file "mntPoint/disk" whose content is the VHD file raw content

```
> sudo fusermount  -uz mntPoint
```

Will unmount the file.

```
> sudo mmls -a mntPoint/disk
DOS Partition Table
Offset Sector: 0
Units are in 512-byte sectors

     Slot    Start        End          Length       Description
02:  00:00   0000002048   0008386559   0008384512   Linux (0x83)
```

Will identify the partitions present in the raw disk

## License

AGPLv3.0 © [Vates SAS](https://vates.fr)
