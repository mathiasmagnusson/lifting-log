const assert = require("assert"); // eslint-disable-line

function validateStructure(struct) {
	function getType(struct) {
		if (struct === null || struct === undefined)               return "null";
		else if (typeof struct === "object"
			&& struct.$union instanceof Array)                     return "union";
		else if (struct instanceof Array && struct.length === 1 ||
			typeof struct === "object" && struct.$type === Array)  return "array";
		else if (struct instanceof Array && struct.length > 1)     return "tuple";
		else if (struct === Number || typeof struct === "object"
			&& struct.$type === Number)                            return "number";
		else if (struct === String || typeof struct === "object"
			&& struct.$type === String)                            return "string";
		else if (struct === BigInt || typeof struct === "object"
			&& struct.$type === BigInt)                            return "bigint";
		else if (typeof struct === "object"
			&& typeof struct.$func === "function")                 return "func";
		else if (typeof struct === "object")                       return "object";

		let input;
		try {
			input = JSON.stringify(struct);
		} catch (_) {
			input = input.toString();
		}
		throw new TypeError("Invalid input " + input);
	}

	const type = getType(struct);
	switch (type) {
	case "array":
		assert(
			struct.$length === undefined
			|| typeof struct.$length === "number"
			|| struct.$length instanceof Array
			&& struct.$length.length === 2
			&& struct.$length.every(n => typeof n === "number")
			&& struct.$length[0] < struct.$length[1],
			"Invalid length specifier for array"
		);
		assert(struct instanceof Array || struct.$all !== undefined);
		break;
	case "number": case "bigint": {
		if (struct.$range !== undefined) {
			assert(
				struct.$range instanceof Array
				&& struct.$length.length === 2
				&& struct.$length.every(n => typeof n === type)
				&& struct.$length[0] < struct.$length[1],
				"Invalid range specifier for number"
			);
		}
		if (struct.$min !== undefined)
			assert(typeof struct.$min === type);
		if (struct.$max !== undefined)
			assert(typeof struct.$max === type);
	} break;
	case "string":
		assert(
			["undefined", "number"].includes(typeof struct.$length)
			|| struct.$length instanceof Array
			&& struct.$length.length === 2
			&& struct.$length.every(n => typeof n === "number")
			&& struct.$length[0] < struct.$length[1]
		);
		assert(typeof struct.$regex === "undefined"
			|| typeof struct.$regex === "object"
			&& struct.$regex instanceof RegExp);
		break;
	}

	assert(["undefined", "function"].includes(typeof struct.$func));

	async function check(struct, path, val) {
		const wrongType = expected => new Error(
			`Object validation error: expected ${expected} at ${
				path || "<root>"
			}, found ${val}`
		);

		const outOfRange = (min, max, found, isLen) => new Error(
			`Object validation error: ${isLen ? "length of " : ""}${
				path || "<root>"
			} must be ${
				min === max ? min : `between ${min} and ${max}`
			}, found ${found}`
		);

		const doesntMatch = regex => new Error(
			`Object validation error: ${
				path || "<root>"
			} must match regular expression ${
				regex.toString()
			}`
		);

		const custom = () => new Error(
			`Object validation error: ${path || "<root>"} must pass custom check`
		);

		let {
			$min,
			$max,
			$range,
			$func,
			$regex,
			$length,
			$union,
			$all,
			$integer,
			$rest,
		} = struct ?? {};

		const type = getType(struct);
		switch (type) {
		case "null":
			assert(
				[null, undefined].includes(val),
				wrongType("null | undefined")
			);
			break;
		case "number": case "bigint":
			assert(
				typeof val === type,
				wrongType("number")
			);
			if ($range) { $min = $range[0]; $max = $range[1]; }
			if ($min !== undefined) assert($min < val, outOfRange($min, $max, val));
			if ($max !== undefined) assert(val < $max, outOfRange($min, $max, val));
			if ($integer) assert(Number.isInteger(val), wrongType("integer"));
			break;
		case "array":
			assert(
				val instanceof Array,
				wrongType("array"),
			);
			if ($length !== undefined) {
				if ($length instanceof Array) {
					$min = $length[0];
					$max = $length[1];
				} else {
					$min = $max = $length;
				}
				assert(
					$min <= val.length && val.length <= $max,
					outOfRange($min, $max, val.length, true),
				);
			}
			for (const i in val)
				await check($all ?? struct[0], `${path}[${i}]`, val[i]);
			break;
		case "tuple":
			assert(
				val instanceof Array,
				wrongType("array (tuple)"),
			);
			assert(
				val.length === struct.length,
				outOfRange(struct.length, struct.length, struct.length, true),
			);
			break;
		case "string":
			assert(
				typeof val === "string",
				wrongType("string"),
			);
			if ($length !== undefined) {
				if ($length instanceof Array) {
					$min = $length[0];
					$max = $length[1];
				} else {
					$min = $max = $length;
				}
				assert(
					$min <= val.length && val.length <= $max,
					outOfRange($min, $max, val.length, true),
				);
			}
			if ($regex) assert(
				$regex.test(val),
				doesntMatch($regex),
			);
			break;
		case "object":
			assert(typeof val === "object", wrongType("object"));
			for (const [k, s] of Object.entries(struct)) if (k[0] !== "$")
				await check(s, `${path}.${k}`, val[k]);
			for (const [k, v] of Object.entries(val)) if (!Object.keys(struct).includes(k))
				await check($rest, `${path}.${k}`, v);
			break;
		case "union": {
			const errors = [];
			for (const variant of $union) {
				try {
					await check(variant, path, val);
					errors.lenth = 0;
					break;
				} catch (err) {
					errors.push(err);
				}
			}
			if (errors) throw new Error(
				"Object validation error: Any of these errors must be fixed: ",
				errors.map(error => error.message).join("\n")
			);
		}
		}

		if (typeof $func === "function") {
			let result = $func(val);
			if (result instanceof Promise) result = await result;
			assert(result, custom());
		}

		return true;
	}

	return (obj, path) => check(struct, path || "", obj);
}

module.exports = validateStructure;
