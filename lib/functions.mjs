/**
 * Bind each of an object's methods to itself.
 *
 * @param {Object} subject
 * @return {Object} The object that was passed.
 */
export function bindMethods(subject){
	const proto = subject.constructor.prototype;
	const keys = new Set([
		...Object.getOwnPropertyNames(proto),
		...Object.keys(subject),
	]);
	for(const key of keys)
		if("function" === typeof subject[key] && "constructor" !== key)
			subject[key] = subject[key].bind(subject);
	return subject;
}


/**
 * Stop a function from firing too quickly.
 *
 * Returns a copy of the original function that runs only after the designated
 * number of milliseconds have elapsed. Useful for throttling onResize handlers.
 *
 * @param {Function} fn - Function to debounce
 * @param {Number} [limit=0] - Threshold to stall execution by, in milliseconds.
 * @param {Boolean} [asap=false] - Call function *before* threshold elapses, not after.
 * @return {Function}
 */
export function debounce(fn, limit = 0, asap = false){
	let started, context, args, timing;
	
	function delayed(){
		const timeSince = Date.now() - started;
		if(timeSince >= limit){
			if(!asap) fn.apply(context, args);
			if(timing) clearTimeout(timing);
			timing = context = args = null;
		}
		else timing = setTimeout(delayed, limit - timeSince);
	}
	
	// Debounced copy of original function
	return function(...args){
		context = this;
		if(!limit)
			return fn.apply(context, args);
		started = Date.now();
		if(!timing){
			if(asap) fn.apply(context, args);
			timing = setTimeout(delayed, limit);
		}
	};
}


/**
 * Generate an exception-proof version of a function.
 *
 * @param {Function} fn
 * @param {Object} [context=null]
 * @throws {TypeError} Argument must be a function.
 * @return {Function}
 */
export function nerf(fn, context = null){
	if("function" !== typeof fn)
		throw new TypeError("Argument must be a function");
	
	let lastError = null;
	function handler(...args){
		let result = null;
		try      { result = fn.call(context, ...args); }
		catch(e) { lastError = e; }
		return result;
	}
	return Object.defineProperty(handler, "lastError", {
		get: () => lastError,
		set: to => lastError = to,
	});
}


/**
 * Keep calling a function until it returns a truthy value.
 *
 * @example poll(async () => (await fetch(url)).done);
 * @param {Function} fn
 * @param {Object} [opts={}]
 * @param {Number} [opts.rate=100]
 * @param {Number} [opts.timeout=0]
 * @param {Boolean} [opts.negate=false]
 * @return {Promise<void>}
 */
export async function poll(fn, opts = {}){
	const {rate = 100, timeout = 0, negate = false} = opts;
	const start = Date.now();
	for(;;){
		const result = await fn();
		if(!negate === !!result) return result;
		if(timeout && Date.now() - start > timeout)
			throw new Error("Timed out");
		await new Promise($ => setTimeout($, rate));
	}
}


/**
 * Monkey-patch an object's method with another function.
 *
 * @param {Object} subject
 * @param {String} methodName
 * @param {Function} handler
 * @return {Function[]}
 */
export function punch(subject, methodName, handler){
	const value = subject[methodName];
	const originalMethod = "function" !== typeof value
		? () => value
		: value;
	
	function punchedMethod(...args){
		const call = () => originalMethod.apply(this, args);
		return handler.call(this, call, args);
	}
	
	subject[methodName] = punchedMethod;
	return [originalMethod, punchedMethod];
}


/**
 * Return a {@link Promise} which auto-resolves after a delay.
 *
 * @param {Number} [delay=100] - Delay in milliseconds
 * @return {Promise<void>}
 */
export function wait(delay = 100){
	return new Promise(resolve => {
		setTimeout(() => resolve(), delay);
	});
}
