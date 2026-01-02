# Monthly Background Photos

Place 12 monthly background images in this folder with the following naming scheme:

- `month-01.jpg` (January)
- `month-02.jpg` (February)
- `month-03.jpg` (March)
- `month-04.jpg` (April)
- `month-05.jpg` (May)
- `month-06.jpg` (June)
- `month-07.jpg` (July)
- `month-08.jpg` (August)
- `month-09.jpg` (September)
- `month-10.jpg` (October)
- `month-11.jpg` (November)
- `month-12.jpg` (December)

**Supported formats:** `.jpg`, `.jpeg`, `.png`, `.webp`

The script will automatically try different extensions if the first one fails.

**To copy images from Desktop/monthPhotos:**
```bash
# From the project root:
cp ~/Desktop/monthPhotos/*.jpg ./monthPhotos/
# or
cp ~/Desktop/monthPhotos/*.png ./monthPhotos/

# Then rename them:
# Rename to month-01.jpg, month-02.jpg, etc. based on month
```

