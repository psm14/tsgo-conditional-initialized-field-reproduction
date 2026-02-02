# tsgo vs tsc: Extra Class Field Declarations for Conditionally Initialized Properties

## Summary

When compiling TypeScript classes with conditionally initialized properties, `tsgo` emits explicit class field declarations at the top of the class body, while `tsc` omits them. This results in different JavaScript output **with observable runtime behavioral differences**.

## Reproduction

```bash
npm install
npm run build
npm run compare  # Show code diff
npm run test     # Show runtime behavior diff
```

## Runtime Behavioral Differences

Running `npm run test` demonstrates that tsc and tsgo produce **different runtime behavior**:

```
=== tsc output ===
Test 1 - hasOwnProperty before assignment: false
Test 2 - Object.keys: ["required"]
Test 3 - Property order: ["third","first"]
Test 4 - "in" operator result: false
Test 5 - JSON.stringify: {"id":123}
Test 5 - Object.keys for JSON: ["id"]
Test 6 - getOwnPropertyNames: ["id"]
Test 7 - Spread keys: ["id"]
Test 8 - Object.entries: [["id",123]]
Test 8 - entries length: 1

=== tsgo output ===
Test 1 - hasOwnProperty before assignment: true
Test 2 - Object.keys: ["required","optional1","optional2"]
Test 3 - Property order: ["first","second","third"]
Test 4 - "in" operator result: true
Test 5 - JSON.stringify: {"id":123}
Test 5 - Object.keys for JSON: ["id","name","data"]
Test 6 - getOwnPropertyNames: ["id","name","data"]
Test 7 - Spread keys: ["id","name","data"]
Test 8 - Object.entries: [["id",123],["name",null],["data",null]]
Test 8 - entries length: 3
```

### Summary of Differences

| Test                               | tsc                 | tsgo               | Impact                              |
| ---------------------------------- | ------------------- | ------------------ | ----------------------------------- |
| `hasOwnProperty` before assignment | `false`             | `true`             | Property checks during construction |
| `Object.keys()`                    | Only assigned props | All declared props | Iteration, serialization            |
| Property order                     | Assignment order    | Declaration order  | Iteration order                     |
| `'prop' in obj`                    | `false`             | `true`             | Property existence checks           |
| `Object.entries()` length          | 1                   | 3                  | Iteration count                     |
| Spread operator                    | Only assigned       | All declared       | Object cloning                      |

## Code Diff

```diff
--- dist-tsc/index.js
+++ dist-tsgo/src/index.js
@@ -13,6 +13,8 @@
 exports.ConditionalPrivate = exports.ConditionalOptional = exports.BranchingInit = void 0;
 // Case 1: Conditionally assigned readonly properties in constructor branches
 class BranchingInit {
+    a;
+    b;
     constructor(useFirst, value) {
         if (useFirst) {
             this.a = value;
@@ -27,6 +29,8 @@
 exports.BranchingInit = BranchingInit;
 // Case 2: Optional properties conditionally assigned
 class ConditionalOptional {
+    value;
+    label;
     constructor(value, includeLabel) {
         this.value = value;
         if (includeLabel) {
@@ -37,6 +41,9 @@
 exports.ConditionalOptional = ConditionalOptional;
 // Case 3: Optional private properties conditionally assigned in constructor
 class ConditionalPrivate {
+    _id;
+    _cached;
+    _tag;
     constructor(id, cached, tag) {
         this._id = id;
         if (cached !== undefined) {
```

## Source TypeScript (Behavioral Test)

```typescript
// Test: Object.keys on instance with unassigned optional property
class MultipleOptional {
  required: string;
  optional1?: string;
  optional2?: number;

  constructor(name: string) {
    this.required = name;
    // optional1 and optional2 are never assigned
  }
}

const multi = new MultipleOptional("test");
console.log(Object.keys(multi));
// tsc:  ["required"]
// tsgo: ["required", "optional1", "optional2"]
```

## tsc output

```javascript
class MultipleOptional {
  constructor(name) {
    this.required = name;
  }
}
```

## tsgo output

```javascript
class MultipleOptional {
  required;
  optional1;
  optional2;
  constructor(name) {
    this.required = name;
  }
}
```

## Patterns Affected

The difference occurs with:

1. **Conditionally assigned readonly properties** - Properties declared in the class but assigned in different branches of an if/else in the constructor
2. **Optional properties** (`property?: Type`) - Properties that may or may not be assigned depending on constructor arguments
3. **Private optional properties** - Same pattern with private visibility
4. **Constructor parameter properties** (`public size: number` in constructor) - These also get field declarations in tsgo

## Real-World Impact

These differences can break code that relies on:

- **Validation logic** checking `hasOwnProperty` or `in` operator
- **Serialization** that iterates over `Object.keys()` or `Object.entries()`
- **Object comparison** that checks property counts or keys
- **Spread operations** that clone objects (`{...obj}`)
- **Property enumeration order** in `for...in` loops or `Object.keys()`
- **Schema validation** libraries that check for unexpected properties
