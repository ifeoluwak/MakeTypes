"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CCollectionShape = exports.CRecordShape = exports.CAnyShape = exports.NullableBooleanShape = exports.BooleanShape = exports.CBooleanShape = exports.NullableStringShape = exports.StringShape = exports.CStringShape = exports.NullableNumberShape = exports.NumberShape = exports.CNumberShape = exports.NullShape = exports.CNullShape = exports.BottomShape = exports.CBottomShape = exports.EntityContext = exports.FieldContext = void 0;
exports.getReferencedRecordShapes = getReferencedRecordShapes;
exports.csh = csh;
exports.d2s = d2s;
const emit_1 = require("./emit");
// Add any more invalid charachaters here 
const invalidChars = /[0-9-+\*\/\?: ]/g;
function safeField(field) {
    return field.match(invalidChars)
        ? `"${field}"`
        : field;
}
function safeInterfaceName(name) {
    return name.match(invalidChars) ? name.replace(invalidChars, "_") : name;
}
function safeObjectField(objectName, field) {
    return field.match(invalidChars)
        ? `${objectName}["${field}"]`
        : `${objectName}.${field}`;
}
function pascalCase(n) {
    return n.split("_").map((s) => (s[0] ? s[0].toUpperCase() : "") + s.slice(1)).join("");
}
function getReferencedRecordShapes(e, s, sh) {
    switch (sh.type) {
        case 2 /* BaseShape.RECORD */:
            if (!s.has(sh)) {
                s.add(sh);
                sh.getReferencedRecordShapes(e, s);
            }
            break;
        case 6 /* BaseShape.COLLECTION */:
            getReferencedRecordShapes(e, s, sh.baseShape);
            break;
        case 7 /* BaseShape.ANY */:
            sh.getDistilledShapes(e).forEach((sh) => getReferencedRecordShapes(e, s, sh));
            break;
    }
}
class FieldContext {
    get type() {
        return 1 /* ContextType.FIELD */;
    }
    parent;
    field;
    constructor(parent, field) {
        this.parent = parent;
        this.field = field;
    }
    getName(e) {
        const name = pascalCase(this.field);
        return name;
    }
}
exports.FieldContext = FieldContext;
class EntityContext {
    get type() {
        return 0 /* ContextType.ENTITY */;
    }
    parent;
    constructor(parent) {
        this.parent = parent;
    }
    getName(e) {
        return `${this.parent.getName(e)}Entity`;
    }
}
exports.EntityContext = EntityContext;
class CBottomShape {
    get type() {
        return 0 /* BaseShape.BOTTOM */;
    }
    get nullable() {
        return false;
    }
    makeNullable() {
        throw new TypeError(`Doesn't make sense.`);
    }
    makeNonNullable() {
        return this;
    }
    emitType(e) {
        throw new Error(`Doesn't make sense.`);
    }
    getProxyType(e) {
        throw new Error(`Doesn't make sense.`);
    }
    equal(t) {
        return this === t;
    }
}
exports.CBottomShape = CBottomShape;
exports.BottomShape = new CBottomShape();
class CNullShape {
    get nullable() {
        return true;
    }
    get type() {
        return 1 /* BaseShape.NULL */;
    }
    makeNullable() {
        return this;
    }
    makeNonNullable() {
        return this;
    }
    emitType(e) {
        e.interfaces.write("null");
    }
    getProxyType(e) {
        return "null";
    }
    equal(t) {
        return this === t;
    }
}
exports.CNullShape = CNullShape;
exports.NullShape = new CNullShape();
class CNumberShape {
    get nullable() {
        return this === exports.NullableNumberShape;
    }
    get type() {
        return 5 /* BaseShape.NUMBER */;
    }
    makeNullable() {
        return exports.NullableNumberShape;
    }
    makeNonNullable() {
        return exports.NumberShape;
    }
    emitType(e) {
        e.interfaces.write(this.getProxyType(e));
    }
    getProxyType(e) {
        let rv = "number";
        if (this.nullable) {
            rv += " | null";
        }
        return rv;
    }
    equal(t) {
        return this === t;
    }
}
exports.CNumberShape = CNumberShape;
exports.NumberShape = new CNumberShape();
exports.NullableNumberShape = new CNumberShape();
class CStringShape {
    get type() {
        return 3 /* BaseShape.STRING */;
    }
    get nullable() {
        return this === exports.NullableStringShape;
    }
    makeNullable() {
        return exports.NullableStringShape;
    }
    makeNonNullable() {
        return exports.StringShape;
    }
    emitType(e) {
        e.interfaces.write(this.getProxyType(e));
    }
    getProxyType(e) {
        let rv = "string";
        if (this.nullable) {
            rv += " | null";
        }
        return rv;
    }
    equal(t) {
        return this === t;
    }
}
exports.CStringShape = CStringShape;
exports.StringShape = new CStringShape();
exports.NullableStringShape = new CStringShape();
class CBooleanShape {
    get type() {
        return 4 /* BaseShape.BOOLEAN */;
    }
    get nullable() {
        return this === exports.NullableBooleanShape;
    }
    makeNullable() {
        return exports.NullableBooleanShape;
    }
    makeNonNullable() {
        return exports.BooleanShape;
    }
    emitType(e) {
        e.interfaces.write(this.getProxyType(e));
    }
    getProxyType(e) {
        let rv = "boolean";
        if (this.nullable) {
            rv += " | null";
        }
        return rv;
    }
    equal(t) {
        return this === t;
    }
}
exports.CBooleanShape = CBooleanShape;
exports.BooleanShape = new CBooleanShape();
exports.NullableBooleanShape = new CBooleanShape();
class CAnyShape {
    get type() {
        return 7 /* BaseShape.ANY */;
    }
    _shapes;
    _nullable = false;
    _hasDistilledShapes = false;
    _distilledShapes = [];
    constructor(shapes, nullable) {
        this._shapes = shapes;
        this._nullable = nullable;
    }
    get nullable() {
        return this._nullable === true;
    }
    makeNullable() {
        if (this._nullable) {
            return this;
        }
        else {
            return new CAnyShape(this._shapes, true);
        }
    }
    makeNonNullable() {
        if (this._nullable) {
            return new CAnyShape(this._shapes, false);
        }
        else {
            return this;
        }
    }
    _ensureDistilled(e) {
        if (!this._hasDistilledShapes) {
            let shapes = new Map();
            for (let i = 0; i < this._shapes.length; i++) {
                const s = this._shapes[i];
                if (!shapes.has(s.type)) {
                    shapes.set(s.type, []);
                }
                shapes.get(s.type).push(s);
            }
            shapes.forEach((shapes, key) => {
                let shape = exports.BottomShape;
                for (let i = 0; i < shapes.length; i++) {
                    shape = csh(e, shape, shapes[i]);
                }
                this._distilledShapes.push(shape);
            });
            this._hasDistilledShapes = true;
        }
    }
    getDistilledShapes(e) {
        this._ensureDistilled(e);
        return this._distilledShapes;
    }
    addToShapes(shape) {
        const shapeClone = this._shapes.slice(0);
        shapeClone.push(shape);
        return new CAnyShape(shapeClone, this._nullable);
    }
    emitType(e) {
        this._ensureDistilled(e);
        this._distilledShapes.forEach((s, i) => {
            s.emitType(e);
            if (i < this._distilledShapes.length - 1) {
                e.interfaces.write(" | ");
            }
        });
    }
    getProxyType(e) {
        this._ensureDistilled(e);
        return this._distilledShapes.map((s) => s.getProxyType(e)).join(" | ");
    }
    equal(t) {
        return this === t;
    }
}
exports.CAnyShape = CAnyShape;
class CRecordShape {
    get type() {
        return 2 /* BaseShape.RECORD */;
    }
    _nullable;
    _fields;
    contexts;
    _name = null;
    constructor(fields, nullable, contexts) {
        // Assign a context to all fields.
        const fieldsWithContext = new Map();
        fields.forEach((val, index) => {
            if (val.type === 2 /* BaseShape.RECORD */ || val.type === 6 /* BaseShape.COLLECTION */) {
                fieldsWithContext.set(index, val.addContext(new FieldContext(this, index)));
            }
            else {
                fieldsWithContext.set(index, val);
            }
        });
        this._fields = fieldsWithContext;
        this._nullable = nullable;
        this.contexts = contexts;
    }
    get nullable() {
        return this._nullable;
    }
    /**
     * Construct a new record shape. Returns an existing, equivalent record shape
     * if applicable.
     */
    static Create(e, fields, nullable, contexts = []) {
        const record = new CRecordShape(fields, nullable, contexts);
        return e.registerRecordShape(record);
    }
    makeNullable() {
        if (this._nullable) {
            return this;
        }
        else {
            return new CRecordShape(this._fields, true, this.contexts);
        }
    }
    addContext(ctx) {
        this.contexts.push(ctx);
        return this;
    }
    makeNonNullable() {
        if (this._nullable) {
            return new CRecordShape(this._fields, false, this.contexts);
        }
        else {
            return this;
        }
    }
    forEachField(cb) {
        this._fields.forEach(cb);
    }
    getField(name) {
        const t = this._fields.get(name);
        if (!t) {
            return exports.NullShape;
        }
        else {
            return t;
        }
    }
    equal(t) {
        if (t.type === 2 /* BaseShape.RECORD */ && this._nullable === t._nullable && this._fields.size === t._fields.size) {
            let rv = true;
            const tFields = t._fields;
            // Check all fields.
            // NOTE: Since size is equal, no need to iterate over t. Either they have the same fields
            // or t is missing fields from this one.
            this.forEachField((t, name) => {
                if (rv) {
                    const field = tFields.get(name);
                    if (field) {
                        rv = field.equal(t);
                    }
                    else {
                        rv = false;
                    }
                }
            });
            return rv;
        }
        return false;
    }
    emitType(e) {
        e.interfaces.write(this.getName(e));
        if (this.nullable) {
            e.interfaces.write(" | null");
        }
    }
    getProxyClass(e) {
        return `${this.getName(e)}Proxy`;
    }
    getProxyType(e) {
        let rv = `${this.getName(e)}Proxy`;
        if (this.nullable) {
            rv += " | null";
        }
        return rv;
    }
    emitInterfaceDefinition(e) {
        const w = e.interfaces;
        w.write(`export interface ${this.getName(e)} {`).endl();
        this.forEachField((t, name) => {
            w.tab(1).write(safeField(name));
            if (t.nullable) {
                w.write("?");
            }
            w.write(": ");
            t.emitType(e);
            w.write(";").endl();
        });
        w.write(`}`);
    }
    emitProxyClass(e) {
        const w = e.proxies;
        w.writeln(`export class ${this.getProxyClass(e)} {`);
        this.forEachField((t, name) => {
            w.tab(1).writeln(`public readonly ${safeField(name)}: ${t.getProxyType(e)};`);
        });
        w.tab(1).writeln(`public static Parse(d: string): ${this.getProxyType(e)} {`);
        w.tab(2).writeln(`return ${this.getProxyClass(e)}.Create(JSON.parse(d));`);
        w.tab(1).writeln(`}`);
        w.tab(1).writeln(`public static Create(d: any, field: string = 'root'): ${this.getProxyType(e)} {`);
        w.tab(2).writeln(`if (!field) {`);
        w.tab(3).writeln(`obj = d;`);
        w.tab(3).writeln(`field = "root";`);
        w.tab(2).writeln(`}`);
        w.tab(2).writeln(`if (d === null || d === undefined) {`);
        w.tab(3);
        if (this.nullable) {
            w.writeln(`return null;`);
        }
        else {
            e.markHelperAsUsed('throwNull2NonNull');
            w.writeln(`throwNull2NonNull(field, d);`);
        }
        w.tab(2).writeln(`} else if (typeof(d) !== 'object') {`);
        e.markHelperAsUsed('throwNotObject');
        w.tab(3).writeln(`throwNotObject(field, d, ${this.nullable});`);
        w.tab(2).writeln(`} else if (Array.isArray(d)) {`);
        e.markHelperAsUsed('throwIsArray');
        w.tab(3).writeln(`throwIsArray(field, d, ${this.nullable});`);
        w.tab(2).writeln(`}`);
        // At this point, we know we have a non-null object.
        // Check all fields.
        this.forEachField((t, name) => {
            (0, emit_1.emitProxyTypeCheck)(e, w, t, 2, `${safeObjectField('d', name)}`, `field + ".${name}"`);
        });
        w.tab(2).writeln(`return new ${this.getProxyClass(e)}(d);`);
        w.tab(1).writeln(`}`);
        w.tab(1).writeln(`private constructor(d: any) {`);
        // Emit an assignment for each field.
        this.forEachField((t, name) => {
            w.tab(2).writeln(`${safeObjectField('this', name)} = ${safeObjectField('d', name)};`);
        });
        w.tab(1).writeln(`}`);
        w.writeln('}');
    }
    getReferencedRecordShapes(e, rv) {
        this.forEachField((t, name) => {
            getReferencedRecordShapes(e, rv, t);
        });
    }
    markAsRoot(name) {
        this._name = name;
    }
    getName(e) {
        if (typeof (this._name) === 'string') {
            return this._name;
        }
        // Calculate unique name.
        const nameSet = new Set();
        let name = this.contexts
            .map((c) => c.getName(e))
            // Remove duplicate names.
            .filter((n) => {
            if (!nameSet.has(n)) {
                nameSet.add(n);
                return true;
            }
            return false;
        })
            .join("Or");
        // Replace invalid Typescript charachters
        name = safeInterfaceName(name);
        this._name = e.registerName(name);
        return this._name;
    }
}
exports.CRecordShape = CRecordShape;
class CCollectionShape {
    get type() {
        return 6 /* BaseShape.COLLECTION */;
    }
    baseShape;
    contexts;
    _name = null;
    constructor(baseShape, contexts = []) {
        // Add context if a record/collection.
        this.baseShape = (baseShape.type === 2 /* BaseShape.RECORD */ || baseShape.type === 6 /* BaseShape.COLLECTION */) ? baseShape.addContext(new EntityContext(this)) : baseShape;
        this.contexts = contexts;
    }
    get nullable() {
        return true;
    }
    makeNullable() {
        return this;
    }
    makeNonNullable() {
        return this;
    }
    addContext(ctx) {
        this.contexts.push(ctx);
        return this;
    }
    emitType(e) {
        e.interfaces.write("(");
        this.baseShape.emitType(e);
        e.interfaces.write(")[] | null");
    }
    getProxyType(e) {
        const base = this.baseShape.getProxyType(e);
        if (base.indexOf("|") !== -1) {
            return `(${base})[] | null`;
        }
        else {
            return `${base}[] | null`;
        }
    }
    equal(t) {
        return t.type === 6 /* BaseShape.COLLECTION */ && this.baseShape.equal(t.baseShape);
    }
    getName(e) {
        if (typeof (this._name) === 'string') {
            return this._name;
        }
        const nameSet = new Set();
        // No need to make collection names unique.
        this._name = this.contexts
            .map((c) => c.getName(e))
            .filter((name) => {
            if (!nameSet.has(name)) {
                nameSet.add(name);
                return true;
            }
            return false;
        })
            .join("Or");
        return this._name;
    }
}
exports.CCollectionShape = CCollectionShape;
function csh(e, s1, s2) {
    // csh(σ, σ) = σ
    if (s1 === s2) {
        return s1;
    }
    if (s1.type === 6 /* BaseShape.COLLECTION */ && s2.type === 6 /* BaseShape.COLLECTION */) {
        // csh([σ1], [σ2]) = [csh(σ1, σ2)]
        return new CCollectionShape(csh(e, s1.baseShape, s2.baseShape));
    }
    // csh(⊥, σ) = csh(σ, ⊥) = σ
    if (s1.type === 0 /* BaseShape.BOTTOM */) {
        return s2;
    }
    if (s2.type === 0 /* BaseShape.BOTTOM */) {
        return s1;
    }
    // csh(null, σ) = csh(σ, null) = nullable<σ>
    if (s1.type === 1 /* BaseShape.NULL */) {
        return s2.makeNullable();
    }
    if (s2.type === 1 /* BaseShape.NULL */) {
        return s1.makeNullable();
    }
    // csh(any, σ) = csh(σ, any) = any
    if (s1.type === 7 /* BaseShape.ANY */) {
        return s1.addToShapes(s2);
    }
    if (s2.type === 7 /* BaseShape.ANY */) {
        return s2.addToShapes(s1);
    }
    // csh(σ2, nullable<σˆ1> ) = csh(nullable<σˆ1> , σ2) = nullable<csh(σˆ1, σ2)>
    if (s1.nullable && s1.type !== 6 /* BaseShape.COLLECTION */) {
        return csh(e, s1.makeNonNullable(), s2).makeNullable();
    }
    if (s2.nullable && s2.type !== 6 /* BaseShape.COLLECTION */) {
        return csh(e, s2.makeNonNullable(), s1).makeNullable();
    }
    // (recd) rule
    if (s1.type === 2 /* BaseShape.RECORD */ && s2.type === 2 /* BaseShape.RECORD */) {
        // Get all fields.
        const fields = new Map();
        s1.forEachField((t, name) => {
            fields.set(name, csh(e, t, s2.getField(name)));
        });
        s2.forEachField((t, name) => {
            if (!fields.has(name)) {
                fields.set(name, csh(e, t, s1.getField(name)));
            }
        });
        return CRecordShape.Create(e, fields, false);
    }
    // (any) rule
    return new CAnyShape([s1, s2], s1.nullable || s2.nullable);
}
function d2s(e, d) {
    if (d === undefined || d === null) {
        return exports.NullShape;
    }
    switch (typeof (d)) {
        case 'number':
            return exports.NumberShape;
        case 'string':
            return exports.StringShape;
        case 'boolean':
            return exports.BooleanShape;
    }
    // Must be an object or array.
    if (Array.isArray(d)) {
        // Empty array: Not enough information to figure out a precise type.
        if (d.length === 0) {
            return new CCollectionShape(exports.NullShape);
        }
        let t = exports.BottomShape;
        for (let i = 0; i < d.length; i++) {
            t = csh(e, t, d2s(e, d[i]));
        }
        return new CCollectionShape(t);
    }
    const keys = Object.keys(d);
    const fields = new Map();
    for (let i = 0; i < keys.length; i++) {
        const name = keys[i];
        fields.set(name, d2s(e, d[name]));
    }
    return CRecordShape.Create(e, fields, false);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvdHlwZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBNENBLDhEQWVDO0FBMmZELGtCQTBEQztBQUVELGtCQWtDQztBQXBwQkQsaUNBQThEO0FBRTVELDBDQUEwQztBQUMxQyxNQUFNLFlBQVksR0FBRyxrQkFBa0IsQ0FBQztBQUMxQyxTQUFTLFNBQVMsQ0FBQyxLQUFhO0lBRTlCLE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUM7UUFDOUIsQ0FBQyxDQUFDLElBQUksS0FBSyxHQUFHO1FBQ2QsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUNaLENBQUM7QUFFRCxTQUFTLGlCQUFpQixDQUFDLElBQVk7SUFDckMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQzNFLENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FBQyxVQUFrQixFQUFFLEtBQWE7SUFFeEQsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQztRQUM5QixDQUFDLENBQUMsR0FBRyxVQUFVLEtBQUssS0FBSyxJQUFJO1FBQzdCLENBQUMsQ0FBQyxHQUFHLFVBQVUsSUFBSSxLQUFLLEVBQUUsQ0FBQztBQUMvQixDQUFDO0FBb0JELFNBQVMsVUFBVSxDQUFDLENBQVM7SUFDM0IsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FB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