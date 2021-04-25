# Files

### Numbers in the file names

- The first number before "D_" is the number of dimensions
- The second number after "D_" is the size of the "N-dimensional cube"

For example: 

- 3D_2000 is 3 dimensions and a 2000 x 2000 x 2000 cube
- 5D_250 is 5 dimensions and a 250 x 250 x 250 x 250 x 250 cube

### File ending

| Name ending or extension | Description |
| ----------- | ----------- |
| .log | The output of the program, probably not interesting |
| *_breakers.csv | Combinations that would break the rule. So far these files are all empty! |
| *_solutions.csv | Number combinations that satisfy the N-dimensional Pythagorean theorem |

### How to read the solutions files

The first N numbers on a line, raised to the power of N will give you the Nth power of the last number on the line. For example line 1 of 3D_2000_solutions.csv is 1,6,8,9. It means that

1<sup>3</sup> + 6<sup>3</sup> + 8<sup>3</sup> = 9<sup>3</sup>, or

1 + 216 + 512 = 729

### Other files

Files starting with "partial" contain partial results with calculations currently running. They are edited by hand - for example currently I have a 5D_1000 calculation running, for an estimated time of 140-170 days.
