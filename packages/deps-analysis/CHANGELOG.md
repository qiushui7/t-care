# @t-care/deps-analysis

## 1.3.2

### Patch Changes

- change complie product
- change compile product
- Updated dependencies
- Updated dependencies
  - @t-care/utils@1.2.8

## 1.3.2-beta.0

### Patch Changes

- change complie product
- Updated dependencies
  - @t-care/utils@1.2.8-beta.0

## 1.3.1

### Patch Changes

- fix cache error
- Updated dependencies
  - @t-care/utils@1.2.7

## 1.3.1-beta.0

### Patch Changes

- fix cache error
- Updated dependencies
  - @t-care/utils@1.2.7-beta.0

## 1.3.0

### Minor Changes

- Support incremental parsing
  Rename browser API to global API

### Patch Changes

- Updated dependencies
  - @t-care/utils@1.2.6

## 1.2.0

### Minor Changes

- new feature ghost dependencies warn

### Patch Changes

- Updated dependencies
  - @t-care/utils@1.2.5

## 1.1.0

### Minor Changes

- new feature nodejs api view

## 1.0.3

### Patch Changes

- Tsconfig. moduleSolution has a significant impact on parse speed, so creatProgram only uses the target and module in options, while others use default values
- Updated dependencies
  - @t-care/utils@1.2.4

## 1.0.2

### Patch Changes

- ###Modify dependency resolution method
  Original method: By reading the baseURL and paths in tsconfig to parse the import name and determine whether it is an external dependency based on various conditions, it is not accurate and cumbersome
  New method: Use the TS compiler to parse the real address and determine if it is an external dependency by checking if it contains Node.js modules
  Problem encountered: Using the TS compiler requires reading the tsconfig configuration, and because the execution directory is different, the baseURL needs to be modified to a relative execution location address
- Updated dependencies
  - @t-care/utils@1.2.3

## 1.0.1

### Patch Changes

- fix ghost denpendency
- Updated dependencies
  - @t-care/utils@1.2.2

## 1.0.0

### Major Changes

- deps-analysis feature

### Patch Changes

- Updated dependencies
  - @t-care/utils@1.2.1
