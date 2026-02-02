/**
 * Minimal reproduction case for tsgo vs tsc class field emission difference.
 *
 * Issue: tsgo emits explicit class field declarations for conditionally
 * initialized properties, while tsc omits them.
 *
 * This results in different JavaScript output that may have subtle
 * behavioral differences (e.g., property enumeration order, hasOwnProperty
 * checks before assignment).
 */

// Case 1: Conditionally assigned readonly properties in constructor branches
export class BranchingInit {
  public readonly a: number;
  public readonly b: number;

  constructor(useFirst: boolean, value: number) {
    if (useFirst) {
      this.a = value;
      this.b = value * 2;
    } else {
      this.b = value;
      this.a = value * 2;
    }
  }
}

// Case 2: Optional properties conditionally assigned
export class ConditionalOptional {
  public value: number;
  public label?: string;

  constructor(value: number, includeLabel: boolean) {
    this.value = value;

    if (includeLabel) {
      this.label = `Value: ${value}`;
    }
  }
}

// Case 3: Optional private properties conditionally assigned in constructor
export abstract class ConditionalPrivate<T> {
  private readonly _id: string;
  private _cached?: T;
  private readonly _tag?: string;

  protected constructor(id: string, cached?: T, tag?: string) {
    this._id = id;
    if (cached !== undefined) {
      this._cached = cached;
    }
    if (tag) {
      this._tag = tag;
    }
  }

  public abstract process(data: T): void;

  get id(): string {
    return this._id;
  }

  get tag(): string | undefined {
    return this._tag;
  }
}
