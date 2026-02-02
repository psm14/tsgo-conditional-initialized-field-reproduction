/**
 * Demonstrates runtime behavioral differences between tsc and tsgo output.
 *
 * Run with: node dist-tsc/test-behavior.js
 *       vs: node dist-tsgo/src/test-behavior.js
 */

// Test 1: hasOwnProperty before conditional assignment
class OptionalField {
  value?: number;

  constructor(setValue: boolean) {
    // Check property existence BEFORE conditional assignment
    const hasPropertyBefore = Object.prototype.hasOwnProperty.call(this, 'value');

    if (setValue) {
      this.value = 42;
    }

    console.log('Test 1 - hasOwnProperty before assignment:', hasPropertyBefore);
  }
}

// Test 2: Object.keys on instance with unassigned optional property
class MultipleOptional {
  required: string;
  optional1?: string;
  optional2?: number;

  constructor(name: string) {
    this.required = name;
    // optional1 and optional2 are never assigned
  }
}

// Test 3: Property enumeration order
class MixedInit {
  first: string;
  second?: number;
  third: string;

  constructor() {
    this.third = 'third';  // Assigned first in constructor
    this.first = 'first';  // Assigned second in constructor
    // second is never assigned
  }
}

// Test 4: 'in' operator check during construction
class InOperatorTest {
  field?: string;
  checkResult: boolean;

  constructor() {
    this.checkResult = 'field' in this;
    // field is never assigned
  }
}

// Test 5: JSON.stringify on object with unassigned optional
class JsonTest {
  id: number;
  name?: string;
  data?: object;

  constructor(id: number) {
    this.id = id;
    // name and data are never assigned
  }
}

// Run all tests
console.log('=== tsgo vs tsc Runtime Behavior Tests ===\n');

// Test 1
new OptionalField(false);
// tsc: false (property doesn't exist until assigned)
// tsgo: true (field declaration creates property with undefined)

// Test 2
const multi = new MultipleOptional('test');
console.log('Test 2 - Object.keys:', JSON.stringify(Object.keys(multi)));
// tsc: ["required"]
// tsgo: ["required", "optional1", "optional2"]

// Test 3
const mixed = new MixedInit();
console.log('Test 3 - Property order:', JSON.stringify(Object.keys(mixed)));
// tsc: ["third", "first"] (order of assignment)
// tsgo: ["first", "second", "third"] (order of declaration)

// Test 4
const inTest = new InOperatorTest();
console.log('Test 4 - "in" operator result:', inTest.checkResult);
// tsc: false
// tsgo: true

// Test 5
const jsonTest = new JsonTest(123);
console.log('Test 5 - JSON.stringify:', JSON.stringify(jsonTest));
// tsc: {"id":123}
// tsgo: {"id":123,"name":undefined,"data":undefined} - wait, undefined is omitted
// Actually both will be {"id":123} but Object.keys differs

console.log('Test 5 - Object.keys for JSON:', JSON.stringify(Object.keys(jsonTest)));
// tsc: ["id"]
// tsgo: ["id", "name", "data"]

// Test 6: getOwnPropertyNames includes unassigned fields
console.log('Test 6 - getOwnPropertyNames:', JSON.stringify(Object.getOwnPropertyNames(jsonTest)));
// tsc: ["id"]
// tsgo: ["id", "name", "data"]

// Test 7: Spread operator behavior
const spread = { ...jsonTest };
console.log('Test 7 - Spread keys:', JSON.stringify(Object.keys(spread)));
// tsc: ["id"]
// tsgo: ["id", "name", "data"]

// Test 8: Object.entries
console.log('Test 8 - Object.entries:', JSON.stringify(Object.entries(jsonTest)));
// tsc: [["id",123]]
// tsgo: [["id",123],["name",null],["data",null]] - actually undefined becomes null? No, filtered
// Actually: [["id",123]] vs [["id",123],["name",undefined],["data",undefined]]
// But JSON.stringify filters undefined, so let's show raw

const entries = Object.entries(jsonTest);
console.log('Test 8 - entries length:', entries.length);
// tsc: 1
// tsgo: 3
