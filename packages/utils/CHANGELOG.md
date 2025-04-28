# @care/utils

## 1.2.6

### Patch Changes

- Support incremental parsing
  Rename browser API to global API

## 1.2.5

### Patch Changes

- new feature ghost dependencies warn

## 1.2.4

### Patch Changes

- Tsconfig. moduleSolution has a significant impact on parse speed, so creatProgram only uses the target and module in options, while others use default values

## 1.2.3

### Patch Changes

- ###Modify dependency resolution method
  Original method: By reading the baseURL and paths in tsconfig to parse the import name and determine whether it is an external dependency based on various conditions, it is not accurate and cumbersome
  New method: Use the TS compiler to parse the real address and determine if it is an external dependency by checking if it contains Node.js modules
  Problem encountered: Using the TS compiler requires reading the tsconfig configuration, and because the execution directory is different, the baseURL needs to be modified to a relative execution location address

## 1.2.2

### Patch Changes

- fix ghost denpendency

## 1.2.1

### Patch Changes

- deps-analysis feature

## 1.2.0

### Minor Changes

- add en language

## 1.1.2

### Patch Changes

- fix file

## 1.1.1

### Patch Changes

- fix name

## 1.1.0

### Minor Changes

- base function
