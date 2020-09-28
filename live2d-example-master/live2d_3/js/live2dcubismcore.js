var Live2DCubismCore;
(function (Live2DCubismCore) {
  var _em_module = (function () {
    var _scriptDir = typeof document !== "undefined" && document.currentScript ? document.currentScript.src : undefined;
    return function (_em_module) {
      _em_module = _em_module || {};
      var Module = typeof _em_module !== "undefined" ? _em_module : {};
      var moduleOverrides = {};
      var key;
      for (key in Module) {
        if (Module.hasOwnProperty(key)) {
          moduleOverrides[key] = Module[key];
        }
      }
      Module["arguments"] = [];
      Module["thisProgram"] = "./this.program";
      Module["quit"] = function (status, toThrow) {
        throw toThrow;
      };
      Module["preRun"] = [];
      Module["postRun"] = [];
      var ENVIRONMENT_IS_WEB = false;
      var ENVIRONMENT_IS_WORKER = false;
      var ENVIRONMENT_IS_NODE = false;
      var ENVIRONMENT_IS_SHELL = false;
      ENVIRONMENT_IS_WEB = typeof window === "object";
      ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
      ENVIRONMENT_IS_NODE = typeof process === "object" && typeof require === "function" && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
      ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
      var scriptDirectory = "";
      function locateFile(path) {
        if (Module["locateFile"]) {
          return Module["locateFile"](path, scriptDirectory);
        } else {
          return scriptDirectory + path;
        }
      }
      if (ENVIRONMENT_IS_NODE) {
        scriptDirectory = __dirname + "/";
        var nodeFS;
        var nodePath;
        Module["read"] = function shell_read(filename, binary) {
          var ret;
          ret = tryParseAsDataURI(filename);
          if (!ret) {
            if (!nodeFS) nodeFS = require("fs");
            if (!nodePath) nodePath = require("path");
            filename = nodePath["normalize"](filename);
            ret = nodeFS["readFileSync"](filename);
          }
          return binary ? ret : ret.toString();
        };
        Module["readBinary"] = function readBinary(filename) {
          var ret = Module["read"](filename, true);
          if (!ret.buffer) {
            ret = new Uint8Array(ret);
          }
          assert(ret.buffer);
          return ret;
        };
        if (process["argv"].length > 1) {
          Module["thisProgram"] = process["argv"][1].replace(/\\/g, "/");
        }
        Module["arguments"] = process["argv"].slice(2);
        process["on"]("uncaughtException", function (ex) {
          if (!(ex instanceof ExitStatus)) {
            throw ex;
          }
        });
        process["on"]("unhandledRejection", abort);
        Module["quit"] = function (status) {
          process["exit"](status);
        };
        Module["inspect"] = function () {
          return "[Emscripten Module object]";
        };
      } else if (ENVIRONMENT_IS_SHELL) {
        if (typeof read != "undefined") {
          Module["read"] = function shell_read(f) {
            var data = tryParseAsDataURI(f);
            if (data) {
              return intArrayToString(data);
            }
            return read(f);
          };
        }
        Module["readBinary"] = function readBinary(f) {
          var data;
          data = tryParseAsDataURI(f);
          if (data) {
            return data;
          }
          if (typeof readbuffer === "function") {
            return new Uint8Array(readbuffer(f));
          }
          data = read(f, "binary");
          assert(typeof data === "object");
          return data;
        };
        if (typeof scriptArgs != "undefined") {
          Module["arguments"] = scriptArgs;
        } else if (typeof arguments != "undefined") {
          Module["arguments"] = arguments;
        }
        if (typeof quit === "function") {
          Module["quit"] = function (status) {
            quit(status);
          };
        }
      } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
        if (ENVIRONMENT_IS_WORKER) {
          scriptDirectory = self.location.href;
        } else if (document.currentScript) {
          scriptDirectory = document.currentScript.src;
        }
        if (_scriptDir) {
          scriptDirectory = _scriptDir;
        }
        if (scriptDirectory.indexOf("blob:") !== 0) {
          scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1);
        } else {
          scriptDirectory = "";
        }
        Module["read"] = function shell_read(url) {
          try {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url, false);
            xhr.send(null);
            return xhr.responseText;
          } catch (err) {
            var data = tryParseAsDataURI(url);
            if (data) {
              return intArrayToString(data);
            }
            throw err;
          }
        };
        if (ENVIRONMENT_IS_WORKER) {
          Module["readBinary"] = function readBinary(url) {
            try {
              var xhr = new XMLHttpRequest();
              xhr.open("GET", url, false);
              xhr.responseType = "arraybuffer";
              xhr.send(null);
              return new Uint8Array(xhr.response);
            } catch (err) {
              var data = tryParseAsDataURI(url);
              if (data) {
                return data;
              }
              throw err;
            }
          };
        }
        Module["readAsync"] = function readAsync(url, onload, onerror) {
          var xhr = new XMLHttpRequest();
          xhr.open("GET", url, true);
          xhr.responseType = "arraybuffer";
          xhr.onload = function xhr_onload() {
            if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
              onload(xhr.response);
              return;
            }
            var data = tryParseAsDataURI(url);
            if (data) {
              onload(data.buffer);
              return;
            }
            onerror();
          };
          xhr.onerror = onerror;
          xhr.send(null);
        };
        Module["setWindowTitle"] = function (title) {
          document.title = title;
        };
      } else {
      }
      var out = Module["print"] || (typeof console !== "undefined" ? console.log.bind(console) : typeof print !== "undefined" ? print : null);
      var err = Module["printErr"] || (typeof printErr !== "undefined" ? printErr : (typeof console !== "undefined" && console.warn.bind(console)) || out);
      for (key in moduleOverrides) {
        if (moduleOverrides.hasOwnProperty(key)) {
          Module[key] = moduleOverrides[key];
        }
      }
      moduleOverrides = undefined;
      var STACK_ALIGN = 16;
      function staticAlloc(size) {
        var ret = STATICTOP;
        STATICTOP = (STATICTOP + size + 15) & -16;
        return ret;
      }
      function dynamicAlloc(size) {
        var ret = HEAP32[DYNAMICTOP_PTR >> 2];
        var end = (ret + size + 15) & -16;
        HEAP32[DYNAMICTOP_PTR >> 2] = end;
        if (end >= TOTAL_MEMORY) {
          var success = enlargeMemory();
          if (!success) {
            HEAP32[DYNAMICTOP_PTR >> 2] = ret;
            return 0;
          }
        }
        return ret;
      }
      function alignMemory(size, factor) {
        if (!factor) factor = STACK_ALIGN;
        var ret = (size = Math.ceil(size / factor) * factor);
        return ret;
      }
      function getNativeTypeSize(type) {
        switch (type) {
          case "i1":
          case "i8":
            return 1;
          case "i16":
            return 2;
          case "i32":
            return 4;
          case "i64":
            return 8;
          case "float":
            return 4;
          case "double":
            return 8;
          default: {
            if (type[type.length - 1] === "*") {
              return 4;
            } else if (type[0] === "i") {
              var bits = parseInt(type.substr(1));
              assert(bits % 8 === 0);
              return bits / 8;
            } else {
              return 0;
            }
          }
        }
      }
      function warnOnce(text) {
        if (!warnOnce.shown) warnOnce.shown = {};
        if (!warnOnce.shown[text]) {
          warnOnce.shown[text] = 1;
          err(text);
        }
      }
      var jsCallStartIndex = 1;
      var functionPointers = new Array(0);
      var funcWrappers = {};
      function dynCall(sig, ptr, args) {
        if (args && args.length) {
          return Module["dynCall_" + sig].apply(null, [ptr].concat(args));
        } else {
          return Module["dynCall_" + sig].call(null, ptr);
        }
      }
      var tempRet0 = 0;
      var setTempRet0 = function (value) {
        tempRet0 = value;
      };
      var getTempRet0 = function () {
        return tempRet0;
      };
      var GLOBAL_BASE = 8;
      var ABORT = false;
      var EXITSTATUS = 0;
      function assert(condition, text) {
        if (!condition) {
          abort("Assertion failed: " + text);
        }
      }
      function getCFunc(ident) {
        var func = Module["_" + ident];
        assert(func, "Cannot call unknown function " + ident + ", make sure it is exported");
        return func;
      }
      var JSfuncs = {
        stackSave: function () {
          stackSave();
        },
        stackRestore: function () {
          stackRestore();
        },
        arrayToC: function (arr) {
          var ret = stackAlloc(arr.length);
          writeArrayToMemory(arr, ret);
          return ret;
        },
        stringToC: function (str) {
          var ret = 0;
          if (str !== null && str !== undefined && str !== 0) {
            var len = (str.length << 2) + 1;
            ret = stackAlloc(len);
            stringToUTF8(str, ret, len);
          }
          return ret;
        },
      };
      var toC = { string: JSfuncs["stringToC"], array: JSfuncs["arrayToC"] };
      function ccall(ident, returnType, argTypes, args, opts) {
        function convertReturnValue(ret) {
          if (returnType === "string") return Pointer_stringify(ret);
          if (returnType === "boolean") return Boolean(ret);
          return ret;
        }
        var func = getCFunc(ident);
        var cArgs = [];
        var stack = 0;
        if (args) {
          for (var i = 0; i < args.length; i++) {
            var converter = toC[argTypes[i]];
            if (converter) {
              if (stack === 0) stack = stackSave();
              cArgs[i] = converter(args[i]);
            } else {
              cArgs[i] = args[i];
            }
          }
        }
        var ret = func.apply(null, cArgs);
        ret = convertReturnValue(ret);
        if (stack !== 0) stackRestore(stack);
        return ret;
      }
      function setValue(ptr, value, type, noSafe) {
        type = type || "i8";
        if (type.charAt(type.length - 1) === "*") type = "i32";
        switch (type) {
          case "i1":
            HEAP8[ptr >> 0] = value;
            break;
          case "i8":
            HEAP8[ptr >> 0] = value;
            break;
          case "i16":
            HEAP16[ptr >> 1] = value;
            break;
          case "i32":
            HEAP32[ptr >> 2] = value;
            break;
          case "i64":
            (tempI64 = [value >>> 0, ((tempDouble = value), +Math_abs(tempDouble) >= +1 ? (tempDouble > +0 ? (Math_min(+Math_floor(tempDouble / +4294967296), +4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / +4294967296) >>> 0) : 0)]), (HEAP32[ptr >> 2] = tempI64[0]), (HEAP32[(ptr + 4) >> 2] = tempI64[1]);
            break;
          case "float":
            HEAPF32[ptr >> 2] = value;
            break;
          case "double":
            HEAPF64[ptr >> 3] = value;
            break;
          default:
            abort("invalid type for setValue: " + type);
        }
      }
      var ALLOC_STATIC = 2;
      var ALLOC_NONE = 4;
      function Pointer_stringify(ptr, length) {
        if (length === 0 || !ptr) return "";
        var hasUtf = 0;
        var t;
        var i = 0;
        while (1) {
          t = HEAPU8[(ptr + i) >> 0];
          hasUtf |= t;
          if (t == 0 && !length) break;
          i++;
          if (length && i == length) break;
        }
        if (!length) length = i;
        var ret = "";
        if (hasUtf < 128) {
          var MAX_CHUNK = 1024;
          var curr;
          while (length > 0) {
            curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
            ret = ret ? ret + curr : curr;
            ptr += MAX_CHUNK;
            length -= MAX_CHUNK;
          }
          return ret;
        }
        return UTF8ToString(ptr);
      }
      var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;
      function UTF8ArrayToString(u8Array, idx) {
        var endPtr = idx;
        while (u8Array[endPtr]) ++endPtr;
        if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
          return UTF8Decoder.decode(u8Array.subarray(idx, endPtr));
        } else {
          var u0, u1, u2, u3, u4, u5;
          var str = "";
          while (1) {
            u0 = u8Array[idx++];
            if (!u0) return str;
            if (!(u0 & 128)) {
              str += String.fromCharCode(u0);
              continue;
            }
            u1 = u8Array[idx++] & 63;
            if ((u0 & 224) == 192) {
              str += String.fromCharCode(((u0 & 31) << 6) | u1);
              continue;
            }
            u2 = u8Array[idx++] & 63;
            if ((u0 & 240) == 224) {
              u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
            } else {
              u3 = u8Array[idx++] & 63;
              if ((u0 & 248) == 240) {
                u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | u3;
              } else {
                u4 = u8Array[idx++] & 63;
                if ((u0 & 252) == 248) {
                  u0 = ((u0 & 3) << 24) | (u1 << 18) | (u2 << 12) | (u3 << 6) | u4;
                } else {
                  u5 = u8Array[idx++] & 63;
                  u0 = ((u0 & 1) << 30) | (u1 << 24) | (u2 << 18) | (u3 << 12) | (u4 << 6) | u5;
                }
              }
            }
            if (u0 < 65536) {
              str += String.fromCharCode(u0);
            } else {
              var ch = u0 - 65536;
              str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
            }
          }
        }
      }
      function UTF8ToString(ptr) {
        return UTF8ArrayToString(HEAPU8, ptr);
      }
      function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
        if (!(maxBytesToWrite > 0)) return 0;
        var startIdx = outIdx;
        var endIdx = outIdx + maxBytesToWrite - 1;
        for (var i = 0; i < str.length; ++i) {
          var u = str.charCodeAt(i);
          if (u >= 55296 && u <= 57343) {
            var u1 = str.charCodeAt(++i);
            u = (65536 + ((u & 1023) << 10)) | (u1 & 1023);
          }
          if (u <= 127) {
            if (outIdx >= endIdx) break;
            outU8Array[outIdx++] = u;
          } else if (u <= 2047) {
            if (outIdx + 1 >= endIdx) break;
            outU8Array[outIdx++] = 192 | (u >> 6);
            outU8Array[outIdx++] = 128 | (u & 63);
          } else if (u <= 65535) {
            if (outIdx + 2 >= endIdx) break;
            outU8Array[outIdx++] = 224 | (u >> 12);
            outU8Array[outIdx++] = 128 | ((u >> 6) & 63);
            outU8Array[outIdx++] = 128 | (u & 63);
          } else if (u <= 2097151) {
            if (outIdx + 3 >= endIdx) break;
            outU8Array[outIdx++] = 240 | (u >> 18);
            outU8Array[outIdx++] = 128 | ((u >> 12) & 63);
            outU8Array[outIdx++] = 128 | ((u >> 6) & 63);
            outU8Array[outIdx++] = 128 | (u & 63);
          } else if (u <= 67108863) {
            if (outIdx + 4 >= endIdx) break;
            outU8Array[outIdx++] = 248 | (u >> 24);
            outU8Array[outIdx++] = 128 | ((u >> 18) & 63);
            outU8Array[outIdx++] = 128 | ((u >> 12) & 63);
            outU8Array[outIdx++] = 128 | ((u >> 6) & 63);
            outU8Array[outIdx++] = 128 | (u & 63);
          } else {
            if (outIdx + 5 >= endIdx) break;
            outU8Array[outIdx++] = 252 | (u >> 30);
            outU8Array[outIdx++] = 128 | ((u >> 24) & 63);
            outU8Array[outIdx++] = 128 | ((u >> 18) & 63);
            outU8Array[outIdx++] = 128 | ((u >> 12) & 63);
            outU8Array[outIdx++] = 128 | ((u >> 6) & 63);
            outU8Array[outIdx++] = 128 | (u & 63);
          }
        }
        outU8Array[outIdx] = 0;
        return outIdx - startIdx;
      }
      function stringToUTF8(str, outPtr, maxBytesToWrite) {
        return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
      }
      function lengthBytesUTF8(str) {
        var len = 0;
        for (var i = 0; i < str.length; ++i) {
          var u = str.charCodeAt(i);
          if (u >= 55296 && u <= 57343) u = (65536 + ((u & 1023) << 10)) | (str.charCodeAt(++i) & 1023);
          if (u <= 127) {
            ++len;
          } else if (u <= 2047) {
            len += 2;
          } else if (u <= 65535) {
            len += 3;
          } else if (u <= 2097151) {
            len += 4;
          } else if (u <= 67108863) {
            len += 5;
          } else {
            len += 6;
          }
        }
        return len;
      }
      var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;
      function demangle(func) {
        return func;
      }
      function demangleAll(text) {
        var regex = /__Z[\w\d_]+/g;
        return text.replace(regex, function (x) {
          var y = demangle(x);
          return x === y ? x : y + " [" + x + "]";
        });
      }
      function jsStackTrace() {
        var err = new Error();
        if (!err.stack) {
          try {
            throw new Error(0);
          } catch (e) {
            err = e;
          }
          if (!err.stack) {
            return "(no stack trace available)";
          }
        }
        return err.stack.toString();
      }
      var WASM_PAGE_SIZE = 65536;
      var ASMJS_PAGE_SIZE = 16777216;
      var MIN_TOTAL_MEMORY = 16777216;
      function alignUp(x, multiple) {
        if (x % multiple > 0) {
          x += multiple - (x % multiple);
        }
        return x;
      }
      var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
      function updateGlobalBuffer(buf) {
        Module["buffer"] = buffer = buf;
      }
      function updateGlobalBufferViews() {
        Module["HEAP8"] = HEAP8 = new Int8Array(buffer);
        Module["HEAP16"] = HEAP16 = new Int16Array(buffer);
        Module["HEAP32"] = HEAP32 = new Int32Array(buffer);
        Module["HEAPU8"] = HEAPU8 = new Uint8Array(buffer);
        Module["HEAPU16"] = HEAPU16 = new Uint16Array(buffer);
        Module["HEAPU32"] = HEAPU32 = new Uint32Array(buffer);
        Module["HEAPF32"] = HEAPF32 = new Float32Array(buffer);
        Module["HEAPF64"] = HEAPF64 = new Float64Array(buffer);
      }
      var STATIC_BASE, STATICTOP, staticSealed;
      var STACK_BASE, STACKTOP, STACK_MAX;
      var DYNAMIC_BASE, DYNAMICTOP_PTR;
      STATIC_BASE = STATICTOP = STACK_BASE = STACKTOP = STACK_MAX = DYNAMIC_BASE = DYNAMICTOP_PTR = 0;
      staticSealed = false;
      function abortOnCannotGrowMemory() {
        abort("Cannot enlarge memory arrays. Either (1) compile with  -s TOTAL_MEMORY=X  with X higher than the current value " + TOTAL_MEMORY + ", (2) compile with  -s ALLOW_MEMORY_GROWTH=1  which allows increasing the size at runtime but prevents some optimizations, (3) set Module.TOTAL_MEMORY to a higher value before the program runs, or (4) if you want malloc to return NULL (0) instead of this abort, compile with  -s ABORTING_MALLOC=0 ");
      }
      if (!Module["reallocBuffer"])
        Module["reallocBuffer"] = function (size) {
          var ret;
          try {
            var oldHEAP8 = HEAP8;
            ret = new ArrayBuffer(size);
            var temp = new Int8Array(ret);
            temp.set(oldHEAP8);
          } catch (e) {
            return false;
          }
          var success = _emscripten_replace_memory(ret);
          if (!success) return false;
          return ret;
        };
      function enlargeMemory() {
        var PAGE_MULTIPLE = Module["usingWasm"] ? WASM_PAGE_SIZE : ASMJS_PAGE_SIZE;
        var LIMIT = 2147483648 - PAGE_MULTIPLE;
        if (HEAP32[DYNAMICTOP_PTR >> 2] > LIMIT) {
          return false;
        }
        var OLD_TOTAL_MEMORY = TOTAL_MEMORY;
        TOTAL_MEMORY = Math.max(TOTAL_MEMORY, MIN_TOTAL_MEMORY);
        while (TOTAL_MEMORY < HEAP32[DYNAMICTOP_PTR >> 2]) {
          if (TOTAL_MEMORY <= 536870912) {
            TOTAL_MEMORY = alignUp(2 * TOTAL_MEMORY, PAGE_MULTIPLE);
          } else {
            TOTAL_MEMORY = Math.min(alignUp((3 * TOTAL_MEMORY + 2147483648) / 4, PAGE_MULTIPLE), LIMIT);
          }
        }
        var replacement = Module["reallocBuffer"](TOTAL_MEMORY);
        if (!replacement || replacement.byteLength != TOTAL_MEMORY) {
          TOTAL_MEMORY = OLD_TOTAL_MEMORY;
          return false;
        }
        updateGlobalBuffer(replacement);
        updateGlobalBufferViews();
        return true;
      }
      var byteLength;
      try {
        byteLength = Function.prototype.call.bind(Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, "byteLength").get);
        byteLength(new ArrayBuffer(4));
      } catch (e) {
        byteLength = function (buffer) {
          return buffer.byteLength;
        };
      }
      var TOTAL_STACK = Module["TOTAL_STACK"] || 5242880;
      var TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 16777216;
      if (TOTAL_MEMORY < TOTAL_STACK) err("TOTAL_MEMORY should be larger than TOTAL_STACK, was " + TOTAL_MEMORY + "! (TOTAL_STACK=" + TOTAL_STACK + ")");
      if (Module["buffer"]) {
        buffer = Module["buffer"];
      } else {
        {
          buffer = new ArrayBuffer(TOTAL_MEMORY);
        }
        Module["buffer"] = buffer;
      }
      updateGlobalBufferViews();
      function getTotalMemory() {
        return TOTAL_MEMORY;
      }
      function callRuntimeCallbacks(callbacks) {
        while (callbacks.length > 0) {
          var callback = callbacks.shift();
          if (typeof callback == "function") {
            callback();
            continue;
          }
          var func = callback.func;
          if (typeof func === "number") {
            if (callback.arg === undefined) {
              Module["dynCall_v"](func);
            } else {
              Module["dynCall_vi"](func, callback.arg);
            }
          } else {
            func(callback.arg === undefined ? null : callback.arg);
          }
        }
      }
      var __ATPRERUN__ = [];
      var __ATINIT__ = [];
      var __ATMAIN__ = [];
      var __ATEXIT__ = [];
      var __ATPOSTRUN__ = [];
      var runtimeInitialized = false;
      var runtimeExited = false;
      function preRun() {
        if (Module["preRun"]) {
          if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
          while (Module["preRun"].length) {
            addOnPreRun(Module["preRun"].shift());
          }
        }
        callRuntimeCallbacks(__ATPRERUN__);
      }
      function ensureInitRuntime() {
        if (runtimeInitialized) return;
        runtimeInitialized = true;
        callRuntimeCallbacks(__ATINIT__);
      }
      function preMain() {
        callRuntimeCallbacks(__ATMAIN__);
      }
      function exitRuntime() {
        callRuntimeCallbacks(__ATEXIT__);
        runtimeExited = true;
      }
      function postRun() {
        if (Module["postRun"]) {
          if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
          while (Module["postRun"].length) {
            addOnPostRun(Module["postRun"].shift());
          }
        }
        callRuntimeCallbacks(__ATPOSTRUN__);
      }
      function addOnPreRun(cb) {
        __ATPRERUN__.unshift(cb);
      }
      function addOnPostRun(cb) {
        __ATPOSTRUN__.unshift(cb);
      }
      function writeArrayToMemory(array, buffer) {
        HEAP8.set(array, buffer);
      }
      function writeAsciiToMemory(str, buffer, dontAddNull) {
        for (var i = 0; i < str.length; ++i) {
          HEAP8[buffer++ >> 0] = str.charCodeAt(i);
        }
        if (!dontAddNull) HEAP8[buffer >> 0] = 0;
      }
      if (!Math.imul || Math.imul(4294967295, 5) !== -5)
        Math.imul = function imul(a, b) {
          var ah = a >>> 16;
          var al = a & 65535;
          var bh = b >>> 16;
          var bl = b & 65535;
          return (al * bl + ((ah * bl + al * bh) << 16)) | 0;
        };
      if (!Math.clz32)
        Math.clz32 = function (x) {
          var n = 32;
          var y = x >> 16;
          if (y) {
            n -= 16;
            x = y;
          }
          y = x >> 8;
          if (y) {
            n -= 8;
            x = y;
          }
          y = x >> 4;
          if (y) {
            n -= 4;
            x = y;
          }
          y = x >> 2;
          if (y) {
            n -= 2;
            x = y;
          }
          y = x >> 1;
          if (y) return n - 2;
          return n - x;
        };
      if (!Math.trunc)
        Math.trunc = function (x) {
          return x < 0 ? Math.ceil(x) : Math.floor(x);
        };
      var Math_abs = Math.abs;
      var Math_ceil = Math.ceil;
      var Math_floor = Math.floor;
      var Math_min = Math.min;
      var runDependencies = 0;
      var runDependencyWatcher = null;
      var dependenciesFulfilled = null;
      function addRunDependency(id) {
        runDependencies++;
        if (Module["monitorRunDependencies"]) {
          Module["monitorRunDependencies"](runDependencies);
        }
      }
      function removeRunDependency(id) {
        runDependencies--;
        if (Module["monitorRunDependencies"]) {
          Module["monitorRunDependencies"](runDependencies);
        }
        if (runDependencies == 0) {
          if (runDependencyWatcher !== null) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null;
          }
          if (dependenciesFulfilled) {
            var callback = dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback();
          }
        }
      }
      Module["preloadedImages"] = {};
      Module["preloadedAudios"] = {};
      var memoryInitializer = null;
      var dataURIPrefix = "data:application/octet-stream;base64,";
      function isDataURI(filename) {
        return String.prototype.startsWith ? filename.startsWith(dataURIPrefix) : filename.indexOf(dataURIPrefix) === 0;
      }
      STATIC_BASE = GLOBAL_BASE;
      STATICTOP = STATIC_BASE + 6e3;
      __ATINIT__.push();
      memoryInitializer = "data:application/octet-stream;base64,AAAAAAAAAAARAAoAERERAAAAAAUAAAAAAAAJAAAAAAsAAAAAAAAAABEADwoREREDCgcAARMJCwsAAAkGCwAACwAGEQAAABEREQAAAAAAAAAAAAAAAAAAAAALAAAAAAAAAAARAAoKERERAAoAAAIACQsAAAAJAAsAAAsAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAAAADAAAAAAMAAAAAAkMAAAAAAAMAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4AAAAAAAAAAAAAAA0AAAAEDQAAAAAJDgAAAAAADgAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAPAAAAAA8AAAAACRAAAAAAABAAABAAABIAAAASEhIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEgAAABISEgAAAAAAAAkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAsAAAAAAAAAAAAAAAoAAAAACgAAAAAJCwAAAAAACwAACwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAMAAAAAAwAAAAACQwAAAAAAAwAAAwAADAxMjM0NTY3ODlBQkNERUZUISIZDQECAxFLHAwQBAsdEh4naG5vcHFiIAUGDxMUFRoIFgcoJBcYCQoOGx8lI4OCfSYqKzw9Pj9DR0pNWFlaW1xdXl9gYWNkZWZnaWprbHJzdHl6e3wAAAAAAAAAAABJbGxlZ2FsIGJ5dGUgc2VxdWVuY2UARG9tYWluIGVycm9yAFJlc3VsdCBub3QgcmVwcmVzZW50YWJsZQBOb3QgYSB0dHkAUGVybWlzc2lvbiBkZW5pZWQAT3BlcmF0aW9uIG5vdCBwZXJtaXR0ZWQATm8gc3VjaCBmaWxlIG9yIGRpcmVjdG9yeQBObyBzdWNoIHByb2Nlc3MARmlsZSBleGlzdHMAVmFsdWUgdG9vIGxhcmdlIGZvciBkYXRhIHR5cGUATm8gc3BhY2UgbGVmdCBvbiBkZXZpY2UAT3V0IG9mIG1lbW9yeQBSZXNvdXJjZSBidXN5AEludGVycnVwdGVkIHN5c3RlbSBjYWxsAFJlc291cmNlIHRlbXBvcmFyaWx5IHVuYXZhaWxhYmxlAEludmFsaWQgc2VlawBDcm9zcy1kZXZpY2UgbGluawBSZWFkLW9ubHkgZmlsZSBzeXN0ZW0ARGlyZWN0b3J5IG5vdCBlbXB0eQBDb25uZWN0aW9uIHJlc2V0IGJ5IHBlZXIAT3BlcmF0aW9uIHRpbWVkIG91dABDb25uZWN0aW9uIHJlZnVzZWQASG9zdCBpcyBkb3duAEhvc3QgaXMgdW5yZWFjaGFibGUAQWRkcmVzcyBpbiB1c2UAQnJva2VuIHBpcGUASS9PIGVycm9yAE5vIHN1Y2ggZGV2aWNlIG9yIGFkZHJlc3MAQmxvY2sgZGV2aWNlIHJlcXVpcmVkAE5vIHN1Y2ggZGV2aWNlAE5vdCBhIGRpcmVjdG9yeQBJcyBhIGRpcmVjdG9yeQBUZXh0IGZpbGUgYnVzeQBFeGVjIGZvcm1hdCBlcnJvcgBJbnZhbGlkIGFyZ3VtZW50AEFyZ3VtZW50IGxpc3QgdG9vIGxvbmcAU3ltYm9saWMgbGluayBsb29wAEZpbGVuYW1lIHRvbyBsb25nAFRvbyBtYW55IG9wZW4gZmlsZXMgaW4gc3lzdGVtAE5vIGZpbGUgZGVzY3JpcHRvcnMgYXZhaWxhYmxlAEJhZCBmaWxlIGRlc2NyaXB0b3IATm8gY2hpbGQgcHJvY2VzcwBCYWQgYWRkcmVzcwBGaWxlIHRvbyBsYXJnZQBUb28gbWFueSBsaW5rcwBObyBsb2NrcyBhdmFpbGFibGUAUmVzb3VyY2UgZGVhZGxvY2sgd291bGQgb2NjdXIAU3RhdGUgbm90IHJlY292ZXJhYmxlAFByZXZpb3VzIG93bmVyIGRpZWQAT3BlcmF0aW9uIGNhbmNlbGVkAEZ1bmN0aW9uIG5vdCBpbXBsZW1lbnRlZABObyBtZXNzYWdlIG9mIGRlc2lyZWQgdHlwZQBJZGVudGlmaWVyIHJlbW92ZWQARGV2aWNlIG5vdCBhIHN0cmVhbQBObyBkYXRhIGF2YWlsYWJsZQBEZXZpY2UgdGltZW91dABPdXQgb2Ygc3RyZWFtcyByZXNvdXJjZXMATGluayBoYXMgYmVlbiBzZXZlcmVkAFByb3RvY29sIGVycm9yAEJhZCBtZXNzYWdlAEZpbGUgZGVzY3JpcHRvciBpbiBiYWQgc3RhdGUATm90IGEgc29ja2V0AERlc3RpbmF0aW9uIGFkZHJlc3MgcmVxdWlyZWQATWVzc2FnZSB0b28gbGFyZ2UAUHJvdG9jb2wgd3JvbmcgdHlwZSBmb3Igc29ja2V0AFByb3RvY29sIG5vdCBhdmFpbGFibGUAUHJvdG9jb2wgbm90IHN1cHBvcnRlZABTb2NrZXQgdHlwZSBub3Qgc3VwcG9ydGVkAE5vdCBzdXBwb3J0ZWQAUHJvdG9jb2wgZmFtaWx5IG5vdCBzdXBwb3J0ZWQAQWRkcmVzcyBmYW1pbHkgbm90IHN1cHBvcnRlZCBieSBwcm90b2NvbABBZGRyZXNzIG5vdCBhdmFpbGFibGUATmV0d29yayBpcyBkb3duAE5ldHdvcmsgdW5yZWFjaGFibGUAQ29ubmVjdGlvbiByZXNldCBieSBuZXR3b3JrAENvbm5lY3Rpb24gYWJvcnRlZABObyBidWZmZXIgc3BhY2UgYXZhaWxhYmxlAFNvY2tldCBpcyBjb25uZWN0ZWQAU29ja2V0IG5vdCBjb25uZWN0ZWQAQ2Fubm90IHNlbmQgYWZ0ZXIgc29ja2V0IHNodXRkb3duAE9wZXJhdGlvbiBhbHJlYWR5IGluIHByb2dyZXNzAE9wZXJhdGlvbiBpbiBwcm9ncmVzcwBTdGFsZSBmaWxlIGhhbmRsZQBSZW1vdGUgSS9PIGVycm9yAFF1b3RhIGV4Y2VlZGVkAE5vIG1lZGl1bSBmb3VuZABXcm9uZyBtZWRpdW0gdHlwZQBObyBlcnJvciBpbmZvcm1hdGlvbgAAAAAAAGQJAAAFAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAgAAACgRAAAABAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAK/////wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASBcAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABbQ1NNXSBbRV1Jbml0aWFsaXplRGVmb3JtZXJzKCk6IFVua25vd24gRGVmb3JtZXIgVHlwZS4KAExpdmUyRCBDdWJpc20gU0RLIENvcmUgVmVyc2lvbiAlZC4lZC4lZABNT0MzAFtDU01dIFtFXWNzbVJldml2ZU1vY0luUGxhY2UgaXMgZmFpbGVkLiBDb3JydXB0ZWQgIG1vYzMgZmlsZS4KAFtDU01dIFtFXWNzbVJldml2ZU1vY0luUGxhY2UgaXMgZmFpbGVkLiBUaGUgQ29yZSB1bnN1cHBvcnQgbGF0ZXIgdGhhbiBtb2MzIHZlcjpbJWRdLiBUaGlzIG1vYzMgdmVyIGlzIFslZF0uCgBbQ1NNXSBbRV0lczogJXMKAGNzbVJldml2ZU1vY0luUGxhY2UAImFkZHJlc3MiIGlzIG51bGwuACJhZGRyZXNzIiBhbGlnbm1lbnQgaXMgaW52YWxpZC4AInNpemUiIGlzIGludmFsaWQuAGNzbVJlYWRDYW52YXNJbmZvACJtb2RlbCIgaXMgaW52YWxpZC4AIm91dFNpemVJblBpeGVscyIgaXMgbnVsbC4AIm91dE9yaWdpbkluUGl4ZWxzIiBpcyBudWxsLgAib3V0UGl4ZWxzUGVyVW5pdCIgaXMgbnVsbC4AY3NtR2V0U2l6ZW9mTW9kZWwAIm1vYyIgaXMgaW52YWxpZC4AY3NtSW5pdGlhbGl6ZU1vZGVsSW5QbGFjZQAic2l6ZSIgaXMgaW52YWxpZABjc21VcGRhdGVNb2RlbABjc21HZXRQYXJhbWV0ZXJDb3VudABjc21HZXRQYXJhbWV0ZXJJZHMAY3NtR2V0UGFyYW1ldGVyTWluaW11bVZhbHVlcwBjc21HZXRQYXJhbWV0ZXJNYXhpbXVtVmFsdWVzAGNzbUdldFBhcmFtZXRlckRlZmF1bHRWYWx1ZXMAY3NtR2V0UGFyYW1ldGVyVmFsdWVzAGNzbUdldFBhcnRDb3VudABjc21HZXRQYXJ0SWRzAGNzbUdldFBhcnRPcGFjaXRpZXMAY3NtR2V0UGFydFBhcmVudFBhcnRJbmRpY2VzAGNzbUdldERyYXdhYmxlQ291bnQAY3NtR2V0RHJhd2FibGVJZHMAY3NtR2V0RHJhd2FibGVDb25zdGFudEZsYWdzAGNzbUdldERyYXdhYmxlRHluYW1pY0ZsYWdzAGNzbUdldERyYXdhYmxlVGV4dHVyZUluZGljZXMAY3NtR2V0RHJhd2FibGVEcmF3T3JkZXJzAGNzbUdldERyYXdhYmxlUmVuZGVyT3JkZXJzAGNzbUdldERyYXdhYmxlT3BhY2l0aWVzAGNzbUdldERyYXdhYmxlTWFza0NvdW50cwBjc21HZXREcmF3YWJsZU1hc2tzAGNzbUdldERyYXdhYmxlVmVydGV4Q291bnRzAGNzbUdldERyYXdhYmxlVmVydGV4UG9zaXRpb25zAGNzbUdldERyYXdhYmxlVmVydGV4VXZzAGNzbUdldERyYXdhYmxlSW5kZXhDb3VudHMAY3NtR2V0RHJhd2FibGVJbmRpY2VzAGNzbVJlc2V0RHJhd2FibGVEeW5hbWljRmxhZ3MAW0NTTV0gW0VdV2FycERlZm9ybWVyOjpUcmFuc2Zvcm1UYXJnZXQoKSBlcnJvci4gWyVkXSBwMDE9KCUuNGYgLCAlLjRmKQoAW0NTTV0gW1ddUm90YXRpb25EZWZvcm1lcjogTm90IGZvdW5kIHRyYW5zZm9ybWVkIERpcmVjdGlvbi4KAFtDU01dIFtFXVVwZGF0ZURlZm9ybWVySGllcmFyY2h5KCk6IFVua25vd24gRGVmb3JtZXIgVHlwZS4KACVzCgAtKyAgIDBYMHgAKG51bGwpAC0wWCswWCAwWC0weCsweCAweABpbmYASU5GAG5hbgBOQU4ALg==";
      var tempDoublePtr = STATICTOP;
      STATICTOP += 16;
      var SYSCALLS = {
        buffers: [null, [], []],
        printChar: function (stream, curr) {
          var buffer = SYSCALLS.buffers[stream];
          assert(buffer);
          if (curr === 0 || curr === 10) {
            (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
            buffer.length = 0;
          } else {
            buffer.push(curr);
          }
        },
        varargs: 0,
        get: function (varargs) {
          SYSCALLS.varargs += 4;
          var ret = HEAP32[(SYSCALLS.varargs - 4) >> 2];
          return ret;
        },
        getStr: function () {
          var ret = Pointer_stringify(SYSCALLS.get());
          return ret;
        },
        get64: function () {
          var low = SYSCALLS.get(),
            high = SYSCALLS.get();
          if (low >= 0) assert(high === 0);
          else assert(high === -1);
          return low;
        },
        getZero: function () {
          assert(SYSCALLS.get() === 0);
        },
      };
      function ___syscall140(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
          var stream = SYSCALLS.getStreamFromFD(),
            offset_high = SYSCALLS.get(),
            offset_low = SYSCALLS.get(),
            result = SYSCALLS.get(),
            whence = SYSCALLS.get();
          var offset = offset_low;
          FS.llseek(stream, offset, whence);
          HEAP32[result >> 2] = stream.position;
          if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
          return 0;
        } catch (e) {
          if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
          return -e.errno;
        }
      }
      function flush_NO_FILESYSTEM() {
        var fflush = Module["_fflush"];
        if (fflush) fflush(0);
        var buffers = SYSCALLS.buffers;
        if (buffers[1].length) SYSCALLS.printChar(1, 10);
        if (buffers[2].length) SYSCALLS.printChar(2, 10);
      }
      function ___syscall146(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
          var stream = SYSCALLS.get(),
            iov = SYSCALLS.get(),
            iovcnt = SYSCALLS.get();
          var ret = 0;
          for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[(iov + i * 8) >> 2];
            var len = HEAP32[(iov + (i * 8 + 4)) >> 2];
            for (var j = 0; j < len; j++) {
              SYSCALLS.printChar(stream, HEAPU8[ptr + j]);
            }
            ret += len;
          }
          return ret;
        } catch (e) {
          if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
          return -e.errno;
        }
      }
      function ___syscall54(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
          return 0;
        } catch (e) {
          if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
          return -e.errno;
        }
      }
      function ___syscall6(which, varargs) {
        SYSCALLS.varargs = varargs;
        try {
          var stream = SYSCALLS.getStreamFromFD();
          FS.close(stream);
          return 0;
        } catch (e) {
          if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
          return -e.errno;
        }
      }
      function _emscripten_memcpy_big(dest, src, num) {
        HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
        return dest;
      }
      function ___setErrNo(value) {
        if (Module["___errno_location"]) HEAP32[Module["___errno_location"]() >> 2] = value;
        return value;
      }
      DYNAMICTOP_PTR = staticAlloc(4);
      STACK_BASE = STACKTOP = alignMemory(STATICTOP);
      STACK_MAX = STACK_BASE + TOTAL_STACK;
      DYNAMIC_BASE = alignMemory(STACK_MAX);
      HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;
      staticSealed = true;
      var ASSERTIONS = false;
      function intArrayToString(array) {
        var ret = [];
        for (var i = 0; i < array.length; i++) {
          var chr = array[i];
          if (chr > 255) {
            if (ASSERTIONS) {
              assert(false, "Character code " + chr + " (" + String.fromCharCode(chr) + ")  at offset " + i + " not in 0x00-0xFF.");
            }
            chr &= 255;
          }
          ret.push(String.fromCharCode(chr));
        }
        return ret.join("");
      }
      var decodeBase64 =
        typeof atob === "function"
          ? atob
          : function (input) {
              var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
              var output = "";
              var chr1, chr2, chr3;
              var enc1, enc2, enc3, enc4;
              var i = 0;
              input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
              do {
                enc1 = keyStr.indexOf(input.charAt(i++));
                enc2 = keyStr.indexOf(input.charAt(i++));
                enc3 = keyStr.indexOf(input.charAt(i++));
                enc4 = keyStr.indexOf(input.charAt(i++));
                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;
                output = output + String.fromCharCode(chr1);
                if (enc3 !== 64) {
                  output = output + String.fromCharCode(chr2);
                }
                if (enc4 !== 64) {
                  output = output + String.fromCharCode(chr3);
                }
              } while (i < input.length);
              return output;
            };
      function intArrayFromBase64(s) {
        if (typeof ENVIRONMENT_IS_NODE === "boolean" && ENVIRONMENT_IS_NODE) {
          var buf;
          try {
            buf = Buffer.from(s, "base64");
          } catch (_) {
            buf = new Buffer(s, "base64");
          }
          return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
        }
        try {
          var decoded = decodeBase64(s);
          var bytes = new Uint8Array(decoded.length);
          for (var i = 0; i < decoded.length; ++i) {
            bytes[i] = decoded.charCodeAt(i);
          }
          return bytes;
        } catch (_) {
          throw new Error("Converting base64 string to bytes failed.");
        }
      }
      function tryParseAsDataURI(filename) {
        if (!isDataURI(filename)) {
          return;
        }
        return intArrayFromBase64(filename.slice(dataURIPrefix.length));
      }
      Module.asmGlobalArg = { Math: Math, Int8Array: Int8Array, Int16Array: Int16Array, Int32Array: Int32Array, Uint8Array: Uint8Array, Uint16Array: Uint16Array, Uint32Array: Uint32Array, Float32Array: Float32Array, Float64Array: Float64Array, NaN: NaN, Infinity: Infinity, byteLength: byteLength };
      Module.asmLibraryArg = { a: abort, b: assert, c: enlargeMemory, d: getTotalMemory, e: setTempRet0, f: getTempRet0, g: abortOnCannotGrowMemory, h: ___setErrNo, i: ___syscall140, j: ___syscall146, k: ___syscall54, l: ___syscall6, m: _emscripten_memcpy_big, n: flush_NO_FILESYSTEM, o: DYNAMICTOP_PTR, p: tempDoublePtr, q: STACKTOP, r: STACK_MAX };
      var asm = (function (global, env, buffer) {
        "almost asm";
        var a = global.Int8Array;
        var b = new a(buffer);
        var c = global.Int16Array;
        var d = new c(buffer);
        var e = global.Int32Array;
        var f = new e(buffer);
        var g = global.Uint8Array;
        var h = new g(buffer);
        var i = global.Uint16Array;
        var j = new i(buffer);
        var k = global.Uint32Array;
        var l = new k(buffer);
        var m = global.Float32Array;
        var n = new m(buffer);
        var o = global.Float64Array;
        var p = new o(buffer);
        var q = global.byteLength;
        var r = env.o | 0;
        var s = env.p | 0;
        var t = env.q | 0;
        var u = env.r | 0;
        var v = 0;
        var w = 0;
        var x = 0;
        var y = 0;
        var z = global.NaN,
          A = global.Infinity;
        var B = 0,
          C = 0,
          D = 0,
          E = 0,
          F = 0;
        var G = global.Math.floor;
        var H = global.Math.abs;
        var I = global.Math.sqrt;
        var J = global.Math.pow;
        var K = global.Math.cos;
        var L = global.Math.sin;
        var M = global.Math.tan;
        var N = global.Math.acos;
        var O = global.Math.asin;
        var P = global.Math.atan;
        var Q = global.Math.atan2;
        var R = global.Math.exp;
        var S = global.Math.log;
        var T = global.Math.ceil;
        var U = global.Math.imul;
        var V = global.Math.min;
        var W = global.Math.max;
        var X = global.Math.clz32;
        var Y = env.a;
        var Z = env.b;
        var _ = env.c;
        var $ = env.d;
        var aa = env.e;
        var ba = env.f;
        var ca = env.g;
        var da = env.h;
        var ea = env.i;
        var fa = env.j;
        var ga = env.k;
        var ha = env.l;
        var ia = env.m;
        var ja = env.n;
        var ka = 0;
        function la(newBuffer) {
          if (q(newBuffer) & 16777215 || q(newBuffer) <= 16777215 || q(newBuffer) > 2147483648) return false;
          b = new a(newBuffer);
          d = new c(newBuffer);
          f = new e(newBuffer);
          h = new g(newBuffer);
          j = new i(newBuffer);
          l = new k(newBuffer);
          n = new m(newBuffer);
          p = new o(newBuffer);
          buffer = newBuffer;
          return true;
        }
        function ra(a) {
          a = a | 0;
          var b = 0;
          b = t;
          t = (t + a) | 0;
          t = (t + 15) & -16;
          return b | 0;
        }
        function sa() {
          return t | 0;
        }
        function ta(a) {
          a = a | 0;
          t = a;
        }
        function ua(a, b) {
          a = a | 0;
          b = b | 0;
          t = a;
          u = b;
        }
        function va(a, b) {
          a = a | 0;
          b = b | 0;
          if (!v) {
            v = a;
            w = b;
          }
        }
        function wa(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          var d = 0,
            e = 0,
            g = 0,
            h = 0;
          h = t;
          t = (t + 272) | 0;
          d = (h + 16) | 0;
          e = h;
          if (0 <= a >>> 0 ? ((g = Ba() | 0), g | 0) : 0) {
            f[e >> 2] = c;
            Sb(d, 256, b, e) | 0;
            oa[g & 0](d);
          }
          t = h;
          return;
        }
        function xa(a) {
          a = a | 0;
          var b = 0,
            c = 0,
            d = 0;
          c = t;
          t = (t + 320) | 0;
          d = (c + 4) | 0;
          b = c;
          Hc(d | 0, 0, 308) | 0;
          ya((a + 704) | 0, d, b);
          t = c;
          return f[b >> 2] | 0;
        }
        function ya(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          var d = 0,
            e = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0;
          f[b >> 2] = 384;
          n = f[a >> 2] | 0;
          i = f[n >> 2] | 0;
          if ((i | 0) > 0) {
            g = f[(a + 296) >> 2] | 0;
            h = f[(a + 16) >> 2] | 0;
            d = 0;
            e = 0;
            do {
              d = ((1 << f[(g + (f[(h + (e << 2)) >> 2] << 2)) >> 2]) + d) | 0;
              e = (e + 1) | 0;
            } while ((e | 0) != (i | 0));
            d = d << 2;
          } else d = 0;
          f[(b + 4) >> 2] = i << 3;
          f[(b + 8) >> 2] = f[n >> 2] << 2;
          f[(b + 12) >> 2] = f[n >> 2] << 2;
          f[(b + 16) >> 2] = f[n >> 2] << 2;
          f[(b + 20) >> 2] = f[n >> 2] << 2;
          f[(b + 24) >> 2] = f[n >> 2] << 2;
          f[(b + 28) >> 2] = f[n >> 2] << 2;
          f[(b + 32) >> 2] = d;
          f[(b + 36) >> 2] = d;
          f[(b + 40) >> 2] = d;
          m = (n + 8) | 0;
          h = f[m >> 2] | 0;
          if ((h | 0) > 0) {
            i = f[(a + 88) >> 2] | 0;
            j = f[(a + 296) >> 2] | 0;
            k = f[(a + 76) >> 2] | 0;
            e = 0;
            g = 0;
            l = 0;
            d = 0;
            do {
              o = f[(i + (e << 2)) >> 2] | 0;
              g = (g | 0) < (o | 0) ? o : g;
              d = ((((o << 3) + 15) & -16) + d) | 0;
              l = ((1 << f[(j + (f[(k + (e << 2)) >> 2] << 2)) >> 2]) + l) | 0;
              e = (e + 1) | 0;
            } while ((e | 0) != (h | 0));
            g = g << 3;
            e = l << 2;
          } else {
            g = 0;
            e = 0;
            d = 0;
          }
          i = (n + 4) | 0;
          f[(b + 44) >> 2] = f[i >> 2] << 5;
          f[(b + 48) >> 2] = (f[m >> 2] | 0) * 24;
          j = (n + 12) | 0;
          f[(b + 52) >> 2] = f[j >> 2] << 5;
          f[(b + 56) >> 2] = f[i >> 2] << 2;
          f[(b + 60) >> 2] = f[m >> 2] << 2;
          f[(b + 64) >> 2] = f[j >> 2] << 2;
          f[(b + 68) >> 2] = f[i >> 2] << 2;
          f[(b + 72) >> 2] = f[i >> 2] << 2;
          f[(b + 76) >> 2] = d;
          f[(b + 80) >> 2] = f[m >> 2] << 2;
          f[(b + 84) >> 2] = f[m >> 2] << 2;
          f[(b + 88) >> 2] = e;
          f[(b + 92) >> 2] = e;
          f[(b + 96) >> 2] = e;
          f[(b + 100) >> 2] = e;
          f[(b + 104) >> 2] = g;
          i = f[j >> 2] | 0;
          if ((i | 0) > 0) {
            g = f[(a + 296) >> 2] | 0;
            h = f[(a + 100) >> 2] | 0;
            d = 0;
            e = 0;
            do {
              e = ((1 << f[(g + (f[(h + (d << 2)) >> 2] << 2)) >> 2]) + e) | 0;
              d = (d + 1) | 0;
            } while ((d | 0) != (i | 0));
            d = e << 2;
          } else d = 0;
          f[(b + 108) >> 2] = i << 2;
          f[(b + 112) >> 2] = f[j >> 2] << 2;
          f[(b + 116) >> 2] = d;
          f[(b + 120) >> 2] = d;
          f[(b + 124) >> 2] = d;
          f[(b + 128) >> 2] = d;
          f[(b + 132) >> 2] = d;
          f[(b + 136) >> 2] = d;
          f[(b + 140) >> 2] = d;
          f[(b + 144) >> 2] = d;
          f[(b + 148) >> 2] = d;
          f[(b + 152) >> 2] = d;
          f[(b + 156) >> 2] = d;
          l = (n + 16) | 0;
          m = f[l >> 2] | 0;
          if ((m | 0) > 0) {
            h = f[(a + 172) >> 2] | 0;
            i = f[(a + 296) >> 2] | 0;
            j = f[(a + 136) >> 2] | 0;
            e = 0;
            k = 0;
            d = 0;
            g = 0;
            do {
              o = f[(h + (g << 2)) >> 2] | 0;
              e = (e | 0) < (o | 0) ? o : e;
              d = ((((o << 3) + 15) & -16) + d) | 0;
              k = ((1 << f[(i + (f[(j + (g << 2)) >> 2] << 2)) >> 2]) + k) | 0;
              g = (g + 1) | 0;
            } while ((g | 0) != (m | 0));
            g = e << 3;
            e = k << 2;
          } else {
            g = 0;
            e = 0;
            d = 0;
          }
          f[(b + 160) >> 2] = m << 4;
          f[(b + 164) >> 2] = f[l >> 2] << 2;
          f[(b + 168) >> 2] = f[l >> 2];
          f[(b + 172) >> 2] = f[l >> 2] << 2;
          f[(b + 176) >> 2] = f[l >> 2] << 2;
          f[(b + 180) >> 2] = f[l >> 2] << 2;
          f[(b + 184) >> 2] = d;
          f[(b + 188) >> 2] = f[l >> 2] << 2;
          f[(b + 192) >> 2] = f[l >> 2] << 2;
          f[(b + 196) >> 2] = f[l >> 2] << 2;
          f[(b + 200) >> 2] = f[l >> 2] << 2;
          f[(b + 204) >> 2] = f[l >> 2] << 2;
          f[(b + 208) >> 2] = f[l >> 2] << 2;
          f[(b + 212) >> 2] = e;
          f[(b + 216) >> 2] = e;
          f[(b + 220) >> 2] = e;
          f[(b + 224) >> 2] = e;
          f[(b + 228) >> 2] = e;
          f[(b + 232) >> 2] = e;
          f[(b + 236) >> 2] = g;
          h = (n + 20) | 0;
          f[(b + 240) >> 2] = (f[h >> 2] | 0) * 40;
          f[(b + 244) >> 2] = f[h >> 2] << 2;
          f[(b + 248) >> 2] = (f[(n + 52) >> 2] | 0) * 28;
          h = f[(n + 48) >> 2] | 0;
          if ((h | 0) > 0) {
            g = f[(a + 296) >> 2] | 0;
            d = 0;
            e = 0;
            do {
              d = ((1 << f[(g + (e << 2)) >> 2]) + d) | 0;
              e = (e + 1) | 0;
            } while ((e | 0) != (h | 0));
            d = d << 2;
          } else d = 0;
          f[(b + 252) >> 2] = h * 36;
          f[(b + 256) >> 2] = d;
          f[(b + 260) >> 2] = d;
          g = (n + 72) | 0;
          f[(b + 264) >> 2] = (f[g >> 2] | 0) * 28;
          g = f[g >> 2] | 0;
          if ((g | 0) > 0) {
            h = f[(a + 328) >> 2] | 0;
            i = f[(a + 336) >> 2] | 0;
            j = f[(a + 340) >> 2] | 0;
            d = 0;
            k = 0;
            e = 0;
            do {
              o = f[(h + (e << 2)) >> 2] | 0;
              d = (d | 0) < (o | 0) ? o : d;
              o = ((f[(i + (e << 2)) >> 2] | 0) - (f[(j + (e << 2)) >> 2] | 0)) | 0;
              k = (k | 0) > (o | 0) ? k : (o + 1) | 0;
              e = (e + 1) | 0;
            } while ((e | 0) != (g | 0));
            e = d << 2;
            d = k << 2;
          } else {
            e = 0;
            d = 0;
          }
          f[(b + 268) >> 2] = f[(n + 76) >> 2] << 4;
          f[(b + 272) >> 2] = d;
          f[(b + 276) >> 2] = e;
          f[(b + 280) >> 2] = d;
          i = (n + 80) | 0;
          j = f[i >> 2] | 0;
          if ((j | 0) > 0) {
            h = f[(a + 296) >> 2] | 0;
            g = f[(a + 364) >> 2] | 0;
            d = 0;
            e = 0;
            do {
              d = ((1 << f[(h + (f[(g + (e << 2)) >> 2] << 2)) >> 2]) + d) | 0;
              e = (e + 1) | 0;
            } while ((e | 0) != (j | 0));
            d = d << 2;
          } else d = 0;
          f[(b + 284) >> 2] = j * 24;
          f[(b + 288) >> 2] = f[i >> 2] << 2;
          f[(b + 292) >> 2] = f[i >> 2] << 2;
          f[(b + 296) >> 2] = d;
          f[(b + 300) >> 2] = d;
          f[(b + 304) >> 2] = d;
          f[b >> 2] = 0;
          d = 1;
          e = 384;
          do {
            o = ((f[(b + (d << 2)) >> 2] | 0) + 15) & -16;
            f[(b + (d << 2)) >> 2] = e;
            e = (o + e) | 0;
            d = (d + 1) | 0;
          } while ((d | 0) != 77);
          f[c >> 2] = e;
          return;
        }
        function za(a, c, d) {
          a = a | 0;
          c = c | 0;
          d = d | 0;
          var e = 0,
            g = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0,
            y = 0,
            z = 0,
            A = 0,
            B = 0,
            C = 0,
            D = 0,
            E = 0,
            F = 0,
            G = 0,
            H = 0,
            I = 0,
            K = 0,
            L = 0,
            M = 0,
            N = 0,
            O = 0,
            P = 0;
          L = t;
          t = (t + 320) | 0;
          y = L;
          r = (L + 8) | 0;
          e = (L + 4) | 0;
          o = (a + 704) | 0;
          Hc(r | 0, 0, 308) | 0;
          ya(o, r, e);
          e = f[e >> 2] | 0;
          if (e >>> 0 > d >>> 0) {
            a = 0;
            t = L;
            return a | 0;
          }
          Hc(c | 0, 0, e | 0) | 0;
          K = (c + (f[r >> 2] | 0)) | 0;
          u = (K + 8) | 0;
          f[u >> 2] = c + (f[(r + 4) >> 2] | 0);
          f[(K + 36) >> 2] = c + (f[(r + 8) >> 2] | 0);
          f[(K + 44) >> 2] = c + (f[(r + 12) >> 2] | 0);
          f[(K + 48) >> 2] = c + (f[(r + 16) >> 2] | 0);
          v = (K + 52) | 0;
          f[v >> 2] = c + (f[(r + 20) >> 2] | 0);
          w = (K + 12) | 0;
          f[w >> 2] = c + (f[(r + 24) >> 2] | 0);
          f[(K + 16) >> 2] = c + (f[(r + 28) >> 2] | 0);
          f[(K + 20) >> 2] = c + (f[(r + 32) >> 2] | 0);
          f[(K + 28) >> 2] = c + (f[(r + 36) >> 2] | 0);
          f[(K + 32) >> 2] = c + (f[(r + 40) >> 2] | 0);
          i = f[o >> 2] | 0;
          x = (K + 60) | 0;
          f[x >> 2] = c + (f[(r + 44) >> 2] | 0);
          g = (c + (f[(r + 48) >> 2] | 0)) | 0;
          z = (K + 68) | 0;
          f[z >> 2] = g;
          B = (K + 76) | 0;
          f[B >> 2] = c + (f[(r + 52) >> 2] | 0);
          f[(K + 168) >> 2] = c + (f[(r + 56) >> 2] | 0);
          f[(K + 172) >> 2] = c + (f[(r + 60) >> 2] | 0);
          f[(K + 176) >> 2] = c + (f[(r + 64) >> 2] | 0);
          f[(K + 192) >> 2] = c + (f[(r + 68) >> 2] | 0);
          f[(K + 196) >> 2] = c + (f[(r + 72) >> 2] | 0);
          i = f[(i + 8) >> 2] | 0;
          if ((i | 0) > 0) {
            j = f[(a + 792) >> 2] | 0;
            d = (c + (f[(r + 76) >> 2] | 0)) | 0;
            e = 0;
            while (1) {
              f[(g + ((e * 24) | 0) + 20) >> 2] = d;
              k = (e + 1) | 0;
              if ((k | 0) == (i | 0)) break;
              else {
                d = (d + (((f[(j + (e << 2)) >> 2] << 3) + 15) & -16)) | 0;
                e = k;
              }
            }
          }
          A = (K + 80) | 0;
          f[A >> 2] = c + (f[(r + 80) >> 2] | 0);
          f[(K + 84) >> 2] = c + (f[(r + 84) >> 2] | 0);
          f[(K + 88) >> 2] = c + (f[(r + 88) >> 2] | 0);
          f[(K + 96) >> 2] = c + (f[(r + 92) >> 2] | 0);
          f[(K + 100) >> 2] = c + (f[(r + 96) >> 2] | 0);
          f[(K + 104) >> 2] = c + (f[(r + 100) >> 2] | 0);
          f[(K + 108) >> 2] = c + (f[(r + 104) >> 2] | 0);
          C = (K + 112) | 0;
          f[C >> 2] = c + (f[(r + 108) >> 2] | 0);
          f[(K + 116) >> 2] = c + (f[(r + 112) >> 2] | 0);
          f[(K + 120) >> 2] = c + (f[(r + 116) >> 2] | 0);
          f[(K + 128) >> 2] = c + (f[(r + 120) >> 2] | 0);
          f[(K + 132) >> 2] = c + (f[(r + 124) >> 2] | 0);
          f[(K + 136) >> 2] = c + (f[(r + 128) >> 2] | 0);
          f[(K + 140) >> 2] = c + (f[(r + 132) >> 2] | 0);
          f[(K + 144) >> 2] = c + (f[(r + 136) >> 2] | 0);
          f[(K + 148) >> 2] = c + (f[(r + 140) >> 2] | 0);
          f[(K + 152) >> 2] = c + (f[(r + 144) >> 2] | 0);
          f[(K + 156) >> 2] = c + (f[(r + 148) >> 2] | 0);
          f[(K + 160) >> 2] = c + (f[(r + 152) >> 2] | 0);
          f[(K + 164) >> 2] = c + (f[(r + 156) >> 2] | 0);
          j = f[o >> 2] | 0;
          F = (K + 204) | 0;
          f[F >> 2] = c + (f[(r + 160) >> 2] | 0);
          f[(K + 248) >> 2] = c + (f[(r + 164) >> 2] | 0);
          f[(K + 260) >> 2] = c + (f[(r + 168) >> 2] | 0);
          f[(K + 264) >> 2] = c + (f[(r + 172) >> 2] | 0);
          f[(K + 268) >> 2] = c + (f[(r + 176) >> 2] | 0);
          d = (c + (f[(r + 180) >> 2] | 0)) | 0;
          i = (K + 272) | 0;
          f[i >> 2] = d;
          j = f[(j + 16) >> 2] | 0;
          if ((j | 0) > 0 ? ((l = (c + (f[(r + 184) >> 2] | 0)) | 0), (m = (a + 876) | 0), (f[d >> 2] = l), (j | 0) != 1) : 0) {
            e = l;
            d = 0;
            g = 1;
            while (1) {
              e = (e + (((f[((f[m >> 2] | 0) + (d << 2)) >> 2] << 3) + 15) & -16)) | 0;
              f[((f[i >> 2] | 0) + (g << 2)) >> 2] = e;
              d = (g + 1) | 0;
              if ((d | 0) >= (j | 0)) break;
              else {
                I = g;
                g = d;
                d = I;
              }
            }
          }
          f[(K + 276) >> 2] = c + (f[(r + 188) >> 2] | 0);
          f[(K + 280) >> 2] = c + (f[(r + 192) >> 2] | 0);
          f[(K + 284) >> 2] = c + (f[(r + 196) >> 2] | 0);
          f[(K + 288) >> 2] = c + (f[(r + 200) >> 2] | 0);
          E = (K + 208) | 0;
          f[E >> 2] = c + (f[(r + 204) >> 2] | 0);
          f[(K + 212) >> 2] = c + (f[(r + 208) >> 2] | 0);
          f[(K + 216) >> 2] = c + (f[(r + 212) >> 2] | 0);
          f[(K + 224) >> 2] = c + (f[(r + 216) >> 2] | 0);
          f[(K + 228) >> 2] = c + (f[(r + 220) >> 2] | 0);
          f[(K + 232) >> 2] = c + (f[(r + 224) >> 2] | 0);
          f[(K + 236) >> 2] = c + (f[(r + 228) >> 2] | 0);
          f[(K + 240) >> 2] = c + (f[(r + 232) >> 2] | 0);
          f[(K + 244) >> 2] = c + (f[(r + 236) >> 2] | 0);
          q = f[(r + 244) >> 2] | 0;
          m = (K + 296) | 0;
          f[m >> 2] = c + (f[(r + 240) >> 2] | 0);
          p = (K + 300) | 0;
          f[p >> 2] = c + q;
          q = (K + 308) | 0;
          f[q >> 2] = c + (f[(r + 248) >> 2] | 0);
          d = f[(r + 256) >> 2] | 0;
          e = f[(r + 260) >> 2] | 0;
          k = f[o >> 2] | 0;
          j = (c + (f[(r + 252) >> 2] | 0)) | 0;
          I = (K + 316) | 0;
          f[I >> 2] = j;
          k = f[(k + 48) >> 2] | 0;
          if ((k | 0) > 0) {
            l = f[(a + 1e3) >> 2] | 0;
            i = 0;
            g = (c + d) | 0;
            d = (c + e) | 0;
            while (1) {
              f[(j + ((i * 36) | 0) + 16) >> 2] = g;
              f[(j + ((i * 36) | 0) + 20) >> 2] = d;
              e = 1 << f[(l + (i << 2)) >> 2];
              i = (i + 1) | 0;
              if ((i | 0) == (k | 0)) break;
              else {
                g = (g + (e << 2)) | 0;
                d = (d + (e << 2)) | 0;
              }
            }
          }
          i = f[o >> 2] | 0;
          g = (c + (f[(r + 264) >> 2] | 0)) | 0;
          D = (K + 324) | 0;
          f[D >> 2] = g;
          i = f[(i + 72) >> 2] | 0;
          if ((i | 0) > 0) {
            j = f[(a + 1032) >> 2] | 0;
            d = (c + (f[(r + 268) >> 2] | 0)) | 0;
            e = 0;
            while (1) {
              f[(g + ((e * 28) | 0) + 12) >> 2] = d;
              k = (e + 1) | 0;
              if ((k | 0) == (i | 0)) break;
              else {
                d = (d + (f[(j + (e << 2)) >> 2] << 4)) | 0;
                e = k;
              }
            }
          }
          f[(K + 328) >> 2] = c + (f[(r + 272) >> 2] | 0);
          f[(K + 332) >> 2] = c + (f[(r + 276) >> 2] | 0);
          f[(K + 336) >> 2] = c + (f[(r + 280) >> 2] | 0);
          G = (K + 344) | 0;
          f[G >> 2] = c + (f[(r + 284) >> 2] | 0);
          H = (K + 348) | 0;
          f[H >> 2] = c + (f[(r + 288) >> 2] | 0);
          f[(K + 352) >> 2] = c + (f[(r + 292) >> 2] | 0);
          f[(K + 356) >> 2] = c + (f[(r + 296) >> 2] | 0);
          f[(K + 364) >> 2] = c + (f[(r + 300) >> 2] | 0);
          f[(K + 368) >> 2] = c + (f[(r + 304) >> 2] | 0);
          f[(K + 376) >> 2] = 1;
          f[(K + 380) >> 2] = b[((f[(a + 708) >> 2] | 0) + 20) >> 0] & 1;
          s = (a + 704) | 0;
          r = f[s >> 2] | 0;
          d = f[(r + 20) >> 2] | 0;
          f[(K + 292) >> 2] = d;
          if ((d | 0) > 0) {
            g = f[m >> 2] | 0;
            i = f[(a + 912) >> 2] | 0;
            j = f[(a + 908) >> 2] | 0;
            k = f[(a + 920) >> 2] | 0;
            c = f[(a + 916) >> 2] | 0;
            l = f[(a + 924) >> 2] | 0;
            m = f[(a + 928) >> 2] | 0;
            o = f[(a + 932) >> 2] | 0;
            e = d;
            do {
              M = e;
              e = (e + -1) | 0;
              O = (i + (e << 2)) | 0;
              f[(g + ((e * 40) | 0)) >> 2] = f[O >> 2];
              P = (j + (e << 2)) | 0;
              f[(g + ((e * 40) | 0) + 4) >> 2] = f[P >> 2];
              n[(g + ((e * 40) | 0) + 8) >> 2] = +n[P >> 2] - +n[O >> 2];
              f[(g + ((e * 40) | 0) + 12) >> 2] = f[(k + (e << 2)) >> 2];
              f[(g + ((e * 40) | 0) + 32) >> 2] = f[(c + (e << 2)) >> 2];
              N = +J(0.10000000149011612, +(+(f[(l + (e << 2)) >> 2] | 0)));
              n[(g + ((e * 40) | 0) + 16) >> 2] = N;
              n[(g + ((e * 40) | 0) + 20) >> 2] = N * 1.5;
              f[(g + ((e * 40) | 0) + 24) >> 2] = f[(m + (e << 2)) >> 2];
              f[(g + ((e * 40) | 0) + 28) >> 2] = f[(o + (e << 2)) >> 2];
              f[(g + ((e * 40) | 0) + 36) >> 2] = 1;
            } while ((M | 0) > 1);
            e = f[p >> 2] | 0;
            do {
              P = d;
              d = (d + -1) | 0;
              f[(e + (d << 2)) >> 2] = f[(c + (d << 2)) >> 2];
            } while ((P | 0) > 1);
          }
          d = f[(r + 52) >> 2] | 0;
          f[(K + 304) >> 2] = d;
          if ((d | 0) > 0) {
            e = f[q >> 2] | 0;
            g = f[(a + 1008) >> 2] | 0;
            i = f[(a + 1012) >> 2] | 0;
            j = f[(a + 1004) >> 2] | 0;
            do {
              P = d;
              d = (d + -1) | 0;
              f[(e + ((d * 28) | 0)) >> 2] = f[(g + (d << 2)) >> 2];
              f[(e + ((d * 28) | 0) + 4) >> 2] = i + (f[(j + (d << 2)) >> 2] << 2);
              n[(e + ((d * 28) | 0) + 12) >> 2] = 0;
              f[(e + ((d * 28) | 0) + 20) >> 2] = 1;
              f[(e + ((d * 28) | 0) + 24) >> 2] = 1;
            } while ((P | 0) > 1);
          }
          d = f[(r + 48) >> 2] | 0;
          f[(K + 312) >> 2] = d;
          if ((d | 0) > 0) {
            e = f[I >> 2] | 0;
            g = f[(a + 1e3) >> 2] | 0;
            i = f[(a + 992) >> 2] | 0;
            j = f[(a + 996) >> 2] | 0;
            do {
              P = d;
              d = (d + -1) | 0;
              O = f[(g + (d << 2)) >> 2] | 0;
              f[(e + ((d * 36) | 0)) >> 2] = O;
              f[(e + ((d * 36) | 0) + 4) >> 2] = 1 << O;
              f[(e + ((d * 36) | 0) + 12) >> 2] = i + (f[(j + (d << 2)) >> 2] << 2);
              f[(e + ((d * 36) | 0) + 24) >> 2] = 1;
              f[(e + ((d * 36) | 0) + 28) >> 2] = 1;
            } while ((P | 0) > 1);
          }
          e = f[r >> 2] | 0;
          f[(K + 4) >> 2] = e;
          m = f[(a + 720) >> 2] | 0;
          f[(K + 40) >> 2] = m;
          if ((e | 0) > 0) {
            i = f[u >> 2] | 0;
            j = f[(a + 740) >> 2] | 0;
            k = f[(a + 736) >> 2] | 0;
            l = f[(a + 732) >> 2] | 0;
            g = f[v >> 2] | 0;
            d = e;
            do {
              P = d;
              d = (d + -1) | 0;
              f[(i + (d << 3)) >> 2] = f[(j + (d << 2)) >> 2];
              f[(i + (d << 3) + 4) >> 2] = f[(k + (d << 2)) >> 2];
              n[(g + (d << 2)) >> 2] = f[(l + (d << 2)) >> 2] | 0 ? 1 : 0;
            } while ((P | 0) > 1);
            i = f[I >> 2] | 0;
            g = f[w >> 2] | 0;
            d = 0;
            do {
              P = e;
              e = (e + -1) | 0;
              O = f[(i + (((f[(m + (e << 2)) >> 2] | 0) * 36) | 0) + 4) >> 2] | 0;
              f[(g + (e << 2)) >> 2] = O;
              d = (O + d) | 0;
            } while ((P | 0) > 1);
          } else d = 0;
          f[(K + 24) >> 2] = d;
          d = f[(r + 4) >> 2] | 0;
          f[(K + 56) >> 2] = d;
          f[(K + 180) >> 2] = f[(a + 752) >> 2];
          c = (K + 184) | 0;
          f[c >> 2] = f[(a + 780) >> 2];
          p = (K + 188) | 0;
          f[p >> 2] = f[(a + 804) >> 2];
          if ((d | 0) > 0) {
            j = (a + 764) | 0;
            k = (a + 768) | 0;
            l = (a + 772) | 0;
            m = (a + 776) | 0;
            o = (a + 760) | 0;
            do {
              e = d;
              d = (d + -1) | 0;
              g = f[x >> 2] | 0;
              f[(g + (d << 5)) >> 2] = f[((f[j >> 2] | 0) + (d << 2)) >> 2];
              f[(g + (d << 5) + 4) >> 2] = f[((f[k >> 2] | 0) + (d << 2)) >> 2];
              P = f[((f[l >> 2] | 0) + (d << 2)) >> 2] | 0;
              f[(g + (d << 5) + 8) >> 2] = P;
              i = f[((f[m >> 2] | 0) + (d << 2)) >> 2] | 0;
              f[(g + (d << 5) + 12) >> 2] = i;
              f[(g + (d << 5) + 28) >> 2] = f[((f[o >> 2] | 0) + (d << 2)) >> 2];
              switch (P | 0) {
                case 0: {
                  f[(g + (d << 5) + 16) >> 2] = 1;
                  f[(g + (d << 5) + 20) >> 2] = 1;
                  f[(g + (d << 5) + 24) >> 2] = (f[z >> 2] | 0) + ((i * 24) | 0);
                  break;
                }
                case 1: {
                  f[(g + (d << 5) + 16) >> 2] = 2;
                  f[(g + (d << 5) + 20) >> 2] = 2;
                  f[(g + (d << 5) + 24) >> 2] = (f[B >> 2] | 0) + (i << 5);
                  break;
                }
                default:
                  wa(4, 2896, y);
              }
            } while ((e | 0) > 1);
            y = f[s >> 2] | 0;
          } else y = r;
          m = f[(y + 8) >> 2] | 0;
          f[(K + 64) >> 2] = m;
          d = (m + -1) | 0;
          l = (m | 0) > 0;
          if (l) {
            g = f[z >> 2] | 0;
            i = f[(a + 796) >> 2] | 0;
            j = f[(a + 800) >> 2] | 0;
            k = f[(a + 792) >> 2] | 0;
            if ((h[(a + 4) >> 0] | 0) > 1) {
              e = f[(a + 1108) >> 2] | 0;
              while (1) {
                f[(g + ((d * 24) | 0)) >> 2] = f[(i + (d << 2)) >> 2];
                f[(g + ((d * 24) | 0) + 4) >> 2] = f[(j + (d << 2)) >> 2];
                f[(g + ((d * 24) | 0) + 12) >> 2] = f[(k + (d << 2)) >> 2];
                f[(g + ((d * 24) | 0) + 8) >> 2] = f[(e + (d << 2)) >> 2];
                if ((d | 0) > 0) d = (d + -1) | 0;
                else break;
              }
            } else
              while (1) {
                f[(g + ((d * 24) | 0)) >> 2] = f[(i + (d << 2)) >> 2];
                f[(g + ((d * 24) | 0) + 4) >> 2] = f[(j + (d << 2)) >> 2];
                f[(g + ((d * 24) | 0) + 12) >> 2] = f[(k + (d << 2)) >> 2];
                f[(g + ((d * 24) | 0) + 8) >> 2] = 0;
                if ((d | 0) > 0) d = (d + -1) | 0;
                else break;
              }
          }
          e = f[(y + 12) >> 2] | 0;
          k = (K + 72) | 0;
          f[k >> 2] = e;
          if ((e | 0) > 0) {
            g = f[B >> 2] | 0;
            i = f[(a + 816) >> 2] | 0;
            d = e;
            do {
              P = d;
              d = (d + -1) | 0;
              f[(g + (d << 5)) >> 2] = f[(i + (d << 2)) >> 2];
            } while ((P | 0) > 1);
          }
          if (l) {
            j = f[I >> 2] | 0;
            i = f[c >> 2] | 0;
            g = f[A >> 2] | 0;
            d = 0;
            e = m;
            do {
              P = e;
              e = (e + -1) | 0;
              O = f[(j + (((f[(i + (e << 2)) >> 2] | 0) * 36) | 0) + 4) >> 2] | 0;
              f[(g + (e << 2)) >> 2] = O;
              d = (O + d) | 0;
            } while ((P | 0) > 1);
            e = f[k >> 2] | 0;
          } else d = 0;
          f[(K + 92) >> 2] = d;
          if ((e | 0) > 0) {
            j = f[I >> 2] | 0;
            i = f[p >> 2] | 0;
            g = f[C >> 2] | 0;
            d = 0;
            do {
              P = e;
              e = (e + -1) | 0;
              O = f[(j + (((f[(i + (e << 2)) >> 2] | 0) * 36) | 0) + 4) >> 2] | 0;
              f[(g + (e << 2)) >> 2] = O;
              d = (O + d) | 0;
            } while ((P | 0) > 1);
          } else d = 0;
          f[(K + 124) >> 2] = d;
          e = f[(y + 16) >> 2] | 0;
          f[(K + 200) >> 2] = e;
          m = f[(a + 840) >> 2] | 0;
          f[(K + 252) >> 2] = m;
          if ((e | 0) > 0) {
            g = f[F >> 2] | 0;
            i = f[(a + 860) >> 2] | 0;
            j = f[(a + 864) >> 2] | 0;
            k = f[(a + 876) >> 2] | 0;
            l = f[(a + 856) >> 2] | 0;
            d = e;
            do {
              P = d;
              d = (d + -1) | 0;
              f[(g + (d << 4)) >> 2] = f[(i + (d << 2)) >> 2];
              f[(g + (d << 4) + 4) >> 2] = f[(j + (d << 2)) >> 2];
              f[(g + (d << 4) + 12) >> 2] = f[(k + (d << 2)) >> 2];
              f[(g + (d << 4) + 8) >> 2] = f[(l + (d << 2)) >> 2];
            } while ((P | 0) > 1);
            i = f[I >> 2] | 0;
            g = f[E >> 2] | 0;
            d = 0;
            do {
              P = e;
              e = (e + -1) | 0;
              O = f[(i + (((f[(m + (e << 2)) >> 2] | 0) * 36) | 0) + 4) >> 2] | 0;
              f[(g + (e << 2)) >> 2] = O;
              d = (O + d) | 0;
            } while ((P | 0) > 1);
          } else d = 0;
          f[(K + 220) >> 2] = d;
          x = f[(y + 72) >> 2] | 0;
          f[(K + 320) >> 2] = x;
          if ((x | 0) > 0) {
            g = f[D >> 2] | 0;
            i = f[(a + 1032) >> 2] | 0;
            j = f[(a + 1036) >> 2] | 0;
            k = f[(a + 1040) >> 2] | 0;
            l = f[(a + 1044) >> 2] | 0;
            m = f[(a + 1028) >> 2] | 0;
            o = (a + 1052) | 0;
            c = (a + 1048) | 0;
            p = (a + 1056) | 0;
            d = 0;
            do {
              q = f[(i + (d << 2)) >> 2] | 0;
              f[(g + ((d * 28) | 0) + 4) >> 2] = q;
              f[(g + ((d * 28) | 0)) >> 2] = f[(j + (d << 2)) >> 2];
              P = f[(k + (d << 2)) >> 2] | 0;
              f[(g + ((d * 28) | 0) + 16) >> 2] = P;
              r = f[(l + (d << 2)) >> 2] | 0;
              f[(g + ((d * 28) | 0) + 20) >> 2] = r;
              f[(g + ((d * 28) | 0) + 24) >> 2] = P + 1 - r;
              f[(g + ((d * 28) | 0) + 8) >> 2] = 0;
              r = f[(m + (d << 2)) >> 2] | 0;
              if ((q | 0) > 0) {
                s = f[(g + ((d * 28) | 0) + 12) >> 2] | 0;
                u = f[o >> 2] | 0;
                v = f[c >> 2] | 0;
                w = f[p >> 2] | 0;
                e = 0;
                do {
                  P = (e + r) | 0;
                  f[(s + (e << 4) + 4) >> 2] = f[(u + (P << 2)) >> 2];
                  f[(s + (e << 4)) >> 2] = f[(v + (P << 2)) >> 2];
                  f[(s + (e << 4) + 8) >> 2] = f[(w + (P << 2)) >> 2];
                  f[(s + (e << 4) + 12) >> 2] = 0;
                  e = (e + 1) | 0;
                } while ((e | 0) != (q | 0));
              }
              d = (d + 1) | 0;
            } while ((d | 0) != (x | 0));
          }
          d = f[(y + 80) >> 2] | 0;
          o = (K + 340) | 0;
          f[o >> 2] = d;
          c = f[(a + 1068) >> 2] | 0;
          f[(K + 372) >> 2] = c;
          if ((d | 0) > 0) {
            e = f[G >> 2] | 0;
            g = f[(a + 1080) >> 2] | 0;
            i = f[(a + 1084) >> 2] | 0;
            j = f[(a + 1092) >> 2] | 0;
            k = f[(a + 1096) >> 2] | 0;
            l = f[(a + 1088) >> 2] | 0;
            m = f[(a + 1100) >> 2] | 0;
            do {
              P = d;
              d = (d + -1) | 0;
              f[(e + ((d * 24) | 0)) >> 2] = f[(g + (d << 2)) >> 2];
              f[(e + ((d * 24) | 0) + 4) >> 2] = f[(i + (d << 2)) >> 2];
              f[(e + ((d * 24) | 0) + 8) >> 2] = f[(j + (d << 2)) >> 2];
              O = f[(l + (d << 2)) >> 2] | 0;
              f[(e + ((d * 24) | 0) + 12) >> 2] = k + (O << 2);
              f[(e + ((d * 24) | 0) + 16) >> 2] = m + (O << 1);
            } while ((P | 0) > 1);
            e = f[o >> 2] | 0;
            if ((e | 0) > 0) {
              i = f[I >> 2] | 0;
              g = f[H >> 2] | 0;
              d = 0;
              do {
                P = e;
                e = (e + -1) | 0;
                O = f[(i + (((f[(c + (e << 2)) >> 2] | 0) * 36) | 0) + 4) >> 2] | 0;
                f[(g + (e << 2)) >> 2] = O;
                d = (O + d) | 0;
              } while ((P | 0) > 1);
            } else d = 0;
          } else d = 0;
          f[(K + 360) >> 2] = d;
          f[K >> 2] = a;
          wb(K);
          P = K;
          t = L;
          return P | 0;
        }
        function Aa(a, c) {
          a = a | 0;
          c = c | 0;
          var e = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            u = 0;
          u = t;
          t = (t + 32) | 0;
          e = (u + 24) | 0;
          g = u;
          f[g >> 2] = 3;
          f[(g + 4) >> 2] = 3;
          f[(g + 8) >> 2] = 0;
          xb(2952, g);
          g = gb() | 0;
          if (Qb(a, 2992, 4) | 0) {
            wa(4, 2997, (u + 16) | 0);
            s = 0;
            t = u;
            return s | 0;
          }
          j = (a + 4) | 0;
          c = b[j >> 0] | 0;
          if ((c & 255) > 2) {
            f[e >> 2] = 2;
            f[(e + 4) >> 2] = c & 255;
            wa(4, 3060, e);
            s = 0;
            t = u;
            return s | 0;
          }
          c = (a + 5) | 0;
          i = (((b[c >> 0] | 0) == 0) | 0) != (g | 0);
          if (i) {
            s = (a + 64) | 0;
            hb(j, 1);
            ib(s, 4, 160);
            b[c >> 0] = ((g | 0) == 0) & 1;
            c = s;
          } else c = (a + 64) | 0;
          h = (a + 704) | 0;
          g = h;
          e = 102;
          while (1) {
            e = (e + -1) | 0;
            f[g >> 2] = a + (f[c >> 2] | 0);
            if (!e) break;
            else {
              g = (g + 4) | 0;
              c = (c + 4) | 0;
            }
          }
          if (i ? ((s = b[j >> 0] | 0), ib(f[h >> 2] | 0, 4, 32), (r = (a + 708) | 0), hb(f[r >> 2] | 0, 4), hb(((f[r >> 2] | 0) + 4) | 0, 4), hb(((f[r >> 2] | 0) + 8) | 0, 4), hb(((f[r >> 2] | 0) + 12) | 0, 4), hb(((f[r >> 2] | 0) + 16) | 0, 4), hb(((f[r >> 2] | 0) + 20) | 0, 1), ib(f[(a + 720) >> 2] | 0, 4, f[f[h >> 2] >> 2] | 0), ib(f[(a + 724) >> 2] | 0, 4, f[f[h >> 2] >> 2] | 0), ib(f[(a + 728) >> 2] | 0, 4, f[f[h >> 2] >> 2] | 0), ib(f[(a + 732) >> 2] | 0, 4, f[f[h >> 2] >> 2] | 0), ib(f[(a + 736) >> 2] | 0, 4, f[f[h >> 2] >> 2] | 0), ib(f[(a + 740) >> 2] | 0, 4, f[f[h >> 2] >> 2] | 0), ib(f[(a + 752) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 4) >> 2] | 0), ib(f[(a + 756) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 4) >> 2] | 0), ib(f[(a + 760) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 4) >> 2] | 0), ib(f[(a + 764) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 4) >> 2] | 0), ib(f[(a + 768) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 4) >> 2] | 0), ib(f[(a + 772) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 4) >> 2] | 0), ib(f[(a + 776) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 4) >> 2] | 0), ib(f[(a + 780) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 8) >> 2] | 0), ib(f[(a + 784) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 8) >> 2] | 0), ib(f[(a + 788) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 8) >> 2] | 0), ib(f[(a + 792) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 8) >> 2] | 0), ib(f[(a + 796) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 8) >> 2] | 0), ib(f[(a + 800) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 8) >> 2] | 0), ib(f[(a + 804) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 12) >> 2] | 0), ib(f[(a + 808) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 12) >> 2] | 0), ib(f[(a + 812) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 12) >> 2] | 0), ib(f[(a + 816) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 12) >> 2] | 0), ib(f[(a + 840) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 16) >> 2] | 0), ib(f[(a + 844) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 16) >> 2] | 0), ib(f[(a + 848) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 16) >> 2] | 0), ib(f[(a + 852) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 16) >> 2] | 0), ib(f[(a + 856) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 16) >> 2] | 0), ib(f[(a + 860) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 16) >> 2] | 0), ib(f[(a + 864) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 16) >> 2] | 0), ib(f[(a + 868) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 16) >> 2] | 0), ib(f[(a + 872) >> 2] | 0, 1, f[((f[h >> 2] | 0) + 16) >> 2] | 0), ib(f[(a + 876) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 16) >> 2] | 0), ib(f[(a + 880) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 16) >> 2] | 0), ib(f[(a + 884) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 16) >> 2] | 0), ib(f[(a + 888) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 16) >> 2] | 0), ib(f[(a + 892) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 16) >> 2] | 0), ib(f[(a + 896) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 16) >> 2] | 0), ib(f[(a + 908) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 20) >> 2] | 0), ib(f[(a + 912) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 20) >> 2] | 0), ib(f[(a + 916) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 20) >> 2] | 0), ib(f[(a + 920) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 20) >> 2] | 0), ib(f[(a + 924) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 20) >> 2] | 0), ib(f[(a + 928) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 20) >> 2] | 0), ib(f[(a + 932) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 20) >> 2] | 0), ib(f[(a + 936) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 24) >> 2] | 0), ib(f[(a + 940) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 28) >> 2] | 0), ib(f[(a + 944) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 28) >> 2] | 0), ib(f[(a + 948) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 32) >> 2] | 0), ib(f[(a + 952) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 32) >> 2] | 0), ib(f[(a + 956) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 32) >> 2] | 0), ib(f[(a + 960) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 32) >> 2] | 0), ib(f[(a + 964) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 32) >> 2] | 0), ib(f[(a + 968) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 32) >> 2] | 0), ib(f[(a + 972) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 32) >> 2] | 0), ib(f[(a + 976) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 36) >> 2] | 0), ib(f[(a + 980) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 36) >> 2] | 0), ib(f[(a + 984) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 36) >> 2] | 0), ib(f[(a + 988) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 40) >> 2] | 0), ib(f[(a + 992) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 44) >> 2] | 0), ib(f[(a + 996) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 48) >> 2] | 0), ib(f[(a + 1e3) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 48) >> 2] | 0), ib(f[(a + 1004) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 52) >> 2] | 0), ib(f[(a + 1008) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 52) >> 2] | 0), ib(f[(a + 1012) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 56) >> 2] | 0), ib(f[(a + 1016) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 60) >> 2] | 0), ib(f[(a + 1020) >> 2] | 0, 2, f[((f[h >> 2] | 0) + 64) >> 2] | 0), ib(f[(a + 1024) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 68) >> 2] | 0), ib(f[(a + 1028) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 72) >> 2] | 0), ib(f[(a + 1032) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 72) >> 2] | 0), ib(f[(a + 1036) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 72) >> 2] | 0), ib(f[(a + 1040) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 72) >> 2] | 0), ib(f[(a + 1044) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 72) >> 2] | 0), ib(f[(a + 1048) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 76) >> 2] | 0), ib(f[(a + 1052) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 76) >> 2] | 0), ib(f[(a + 1056) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 76) >> 2] | 0), ib(f[(a + 1068) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 80) >> 2] | 0), ib(f[(a + 1072) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 80) >> 2] | 0), ib(f[(a + 1076) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 80) >> 2] | 0), ib(f[(a + 1080) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 80) >> 2] | 0), ib(f[(a + 1084) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 80) >> 2] | 0), ib(f[(a + 1088) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 80) >> 2] | 0), ib(f[(a + 1092) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 80) >> 2] | 0), ib(f[(a + 1096) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 84) >> 2] | 0), ib(f[(a + 1100) >> 2] | 0, 2, f[((f[h >> 2] | 0) + 84) >> 2] | 0), ib(f[(a + 1104) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 88) >> 2] | 0), (s & 255) > 1) : 0) {
            ib(f[(a + 1108) >> 2] | 0, 4, f[((f[h >> 2] | 0) + 8) >> 2] | 0);
            s = h;
          } else s = h;
          jb();
          c = f[s >> 2] | 0;
          if ((f[c >> 2] | 0) > 0) {
            g = (a + 716) | 0;
            h = (a + 712) | 0;
            e = 0;
            do {
              f[((f[h >> 2] | 0) + (e << 2)) >> 2] = (f[g >> 2] | 0) + (e << 6);
              e = (e + 1) | 0;
              c = f[s >> 2] | 0;
            } while ((e | 0) < (f[c >> 2] | 0));
          }
          if ((f[(c + 4) >> 2] | 0) > 0) {
            g = (a + 748) | 0;
            h = (a + 744) | 0;
            e = 0;
            do {
              f[((f[h >> 2] | 0) + (e << 2)) >> 2] = (f[g >> 2] | 0) + (e << 6);
              e = (e + 1) | 0;
              c = f[s >> 2] | 0;
            } while ((e | 0) < (f[(c + 4) >> 2] | 0));
          }
          if ((f[(c + 16) >> 2] | 0) > 0) {
            g = (a + 836) | 0;
            h = (a + 820) | 0;
            i = (a + 1016) | 0;
            j = (a + 880) | 0;
            k = (a + 824) | 0;
            l = (a + 1020) | 0;
            m = (a + 884) | 0;
            o = (a + 828) | 0;
            p = (a + 1024) | 0;
            q = (a + 892) | 0;
            r = (a + 832) | 0;
            e = 0;
            do {
              f[((f[h >> 2] | 0) + (e << 2)) >> 2] = (f[g >> 2] | 0) + (e << 6);
              f[((f[k >> 2] | 0) + (e << 2)) >> 2] = (f[i >> 2] | 0) + (f[((f[j >> 2] | 0) + (e << 2)) >> 2] << 2);
              f[((f[o >> 2] | 0) + (e << 2)) >> 2] = (f[l >> 2] | 0) + (f[((f[m >> 2] | 0) + (e << 2)) >> 2] << 1);
              f[((f[r >> 2] | 0) + (e << 2)) >> 2] = (f[p >> 2] | 0) + (f[((f[q >> 2] | 0) + (e << 2)) >> 2] << 2);
              e = (e + 1) | 0;
              c = f[s >> 2] | 0;
            } while ((e | 0) < (f[(c + 16) >> 2] | 0));
          }
          if ((f[(c + 20) >> 2] | 0) > 0) {
            g = (a + 904) | 0;
            h = (a + 900) | 0;
            e = 0;
            do {
              f[((f[h >> 2] | 0) + (e << 2)) >> 2] = (f[g >> 2] | 0) + (e << 6);
              e = (e + 1) | 0;
              c = f[s >> 2] | 0;
            } while ((e | 0) < (f[(c + 20) >> 2] | 0));
          }
          if ((f[(c + 80) >> 2] | 0) > 0) {
            g = (a + 1064) | 0;
            h = (a + 1060) | 0;
            e = 0;
            do {
              f[((f[h >> 2] | 0) + (e << 2)) >> 2] = (f[g >> 2] | 0) + (e << 6);
              e = (e + 1) | 0;
              c = f[s >> 2] | 0;
            } while ((e | 0) < (f[(c + 80) >> 2] | 0));
          }
          if (b[((f[(a + 708) >> 2] | 0) + 20) >> 0] & 1) {
            s = a;
            t = u;
            return s | 0;
          }
          l = f[(c + 16) >> 2] | 0;
          if ((l | 0) <= 0) {
            s = a;
            t = u;
            return s | 0;
          }
          g = f[(a + 1020) >> 2] | 0;
          h = f[(a + 884) >> 2] | 0;
          i = f[(a + 888) >> 2] | 0;
          e = 0;
          do {
            j = (g + (f[(h + (e << 2)) >> 2] << 1)) | 0;
            s = f[(i + (e << 2)) >> 2] | 0;
            k = (s + -1) | 0;
            if ((s | 0) > 1) {
              c = 0;
              do {
                q = (j + (c << 1)) | 0;
                r = d[q >> 1] | 0;
                s = (j + ((c + 2) << 1)) | 0;
                d[q >> 1] = d[s >> 1] | 0;
                d[s >> 1] = r;
                c = (c + 3) | 0;
              } while ((c | 0) < (k | 0));
            }
            e = (e + 1) | 0;
          } while ((e | 0) != (l | 0));
          g = f[(a + 1016) >> 2] | 0;
          h = f[(a + 880) >> 2] | 0;
          i = f[(a + 876) >> 2] | 0;
          e = 0;
          do {
            c = (g + (f[(h + (e << 2)) >> 2] << 2)) | 0;
            s = f[(i + (e << 2)) >> 2] << 1;
            j = (c + (s << 2)) | 0;
            if ((s | 0) > 1) {
              c = (c + 4) | 0;
              do {
                n[c >> 2] = 1 - +n[c >> 2];
                c = (c + 8) | 0;
              } while (c >>> 0 < j >>> 0);
            }
            e = (e + 1) | 0;
          } while ((e | 0) != (l | 0));
          t = u;
          return a | 0;
        }
        function Ba() {
          return 0;
        }
        function Ca(a, b) {
          a = a | 0;
          b = b | 0;
          var c = 0,
            d = 0,
            e = 0,
            g = 0;
          g = t;
          t = (t + 32) | 0;
          e = (g + 16) | 0;
          d = (g + 8) | 0;
          c = g;
          if (!a) {
            f[c >> 2] = 3186;
            f[(c + 4) >> 2] = 3206;
            wa(4, 3169, c);
            e = 0;
            t = g;
            return e | 0;
          }
          c = a;
          if ((((c + 63) & -64) | 0) != (c | 0)) {
            f[d >> 2] = 3186;
            f[(d + 4) >> 2] = 3225;
            wa(4, 3169, d);
            e = 0;
            t = g;
            return e | 0;
          }
          if (b | 0 ? (((b + 63) & -64) | 0) == (b | 0) : 0) {
            e = Aa(a, b) | 0;
            t = g;
            return e | 0;
          }
          f[e >> 2] = 3186;
          f[(e + 4) >> 2] = 3257;
          wa(4, 3169, e);
          e = 0;
          t = g;
          return e | 0;
        }
        function Da(a, b, c, d) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          var e = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0;
          j = t;
          t = (t + 32) | 0;
          g = (j + 24) | 0;
          i = (j + 16) | 0;
          h = (j + 8) | 0;
          e = j;
          if (!a) {
            f[e >> 2] = 3276;
            f[(e + 4) >> 2] = 3294;
            wa(4, 3169, e);
            t = j;
            return;
          }
          if (!b) {
            f[h >> 2] = 3276;
            f[(h + 4) >> 2] = 3314;
            wa(4, 3169, h);
            t = j;
            return;
          }
          if (!c) {
            f[i >> 2] = 3276;
            f[(i + 4) >> 2] = 3341;
            wa(4, 3169, i);
            t = j;
            return;
          }
          if (!d) {
            f[g >> 2] = 3276;
            f[(g + 4) >> 2] = 3370;
            wa(4, 3169, g);
            t = j;
            return;
          } else {
            i = f[((f[a >> 2] | 0) + 708) >> 2] | 0;
            f[b >> 2] = f[(i + 12) >> 2];
            f[(b + 4) >> 2] = f[(i + 16) >> 2];
            f[c >> 2] = f[(i + 4) >> 2];
            f[(c + 4) >> 2] = f[(i + 8) >> 2];
            f[d >> 2] = f[i >> 2];
            t = j;
            return;
          }
        }
        function Ea(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 3398;
            f[(b + 4) >> 2] = 3416;
            wa(4, 3169, b);
            b = 0;
            t = c;
            return b | 0;
          } else {
            b = xa(a) | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function Fa(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          var d = 0,
            e = 0,
            g = 0,
            h = 0,
            i = 0;
          i = t;
          t = (t + 32) | 0;
          h = (i + 24) | 0;
          g = (i + 16) | 0;
          e = (i + 8) | 0;
          d = i;
          if (!a) {
            f[d >> 2] = 3434;
            f[(d + 4) >> 2] = 3416;
            wa(4, 3169, d);
            h = 0;
            t = i;
            return h | 0;
          }
          if (!b) {
            f[e >> 2] = 3434;
            f[(e + 4) >> 2] = 3206;
            wa(4, 3169, e);
            h = 0;
            t = i;
            return h | 0;
          }
          e = b;
          if ((((e + 15) & -16) | 0) != (e | 0)) {
            f[g >> 2] = 3434;
            f[(g + 4) >> 2] = 3225;
            wa(4, 3169, g);
            h = 0;
            t = i;
            return h | 0;
          }
          a = za(a, b, c) | 0;
          if (!a) {
            f[h >> 2] = 3434;
            f[(h + 4) >> 2] = 3460;
            wa(4, 3169, h);
            h = 0;
            t = i;
            return h | 0;
          } else {
            h = a;
            t = i;
            return h | 0;
          }
          return 0;
        }
        function Ga(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 3478;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            t = c;
            return;
          } else {
            wb(a);
            t = c;
            return;
          }
        }
        function Ha(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 3493;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            b = -1;
            t = c;
            return b | 0;
          } else {
            b = f[(a + 292) >> 2] | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function Ia(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 3514;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            b = 0;
            t = c;
            return b | 0;
          } else {
            b = f[((f[a >> 2] | 0) + 900) >> 2] | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function Ja(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 3533;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            b = 0;
            t = c;
            return b | 0;
          } else {
            b = f[((f[a >> 2] | 0) + 912) >> 2] | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function Ka(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 3562;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            b = 0;
            t = c;
            return b | 0;
          } else {
            b = f[((f[a >> 2] | 0) + 908) >> 2] | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function La(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 3591;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            b = 0;
            t = c;
            return b | 0;
          } else {
            b = f[((f[a >> 2] | 0) + 916) >> 2] | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function Ma(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 3620;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            b = 0;
            t = c;
            return b | 0;
          } else {
            b = f[(a + 300) >> 2] | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function Na(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 3642;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            b = -1;
            t = c;
            return b | 0;
          } else {
            b = f[(a + 4) >> 2] | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function Oa(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 3658;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            b = 0;
            t = c;
            return b | 0;
          } else {
            b = f[((f[a >> 2] | 0) + 712) >> 2] | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function Pa(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 3672;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            b = 0;
            t = c;
            return b | 0;
          } else {
            b = f[(a + 52) >> 2] | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function Qa(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 3692;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            b = 0;
            t = c;
            return b | 0;
          } else {
            b = f[((f[a >> 2] | 0) + 740) >> 2] | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function Ra(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 3720;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            b = -1;
            t = c;
            return b | 0;
          } else {
            b = f[(a + 200) >> 2] | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function Sa(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 3740;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            b = 0;
            t = c;
            return b | 0;
          } else {
            b = f[((f[a >> 2] | 0) + 820) >> 2] | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function Ta(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 3758;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            b = 0;
            t = c;
            return b | 0;
          } else {
            b = f[((f[a >> 2] | 0) + 872) >> 2] | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function Ua(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 3786;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            b = 0;
            t = c;
            return b | 0;
          } else {
            b = f[(a + 260) >> 2] | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function Va(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 3813;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            b = 0;
            t = c;
            return b | 0;
          } else {
            b = f[((f[a >> 2] | 0) + 868) >> 2] | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function Wa(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 3842;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            b = 0;
            t = c;
            return b | 0;
          } else {
            b = f[(a + 268) >> 2] | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function Xa(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 3867;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            b = 0;
            t = c;
            return b | 0;
          } else {
            b = f[(a + 264) >> 2] | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function Ya(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 3894;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            b = 0;
            t = c;
            return b | 0;
          } else {
            b = f[(a + 276) >> 2] | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function Za(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 3918;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            b = 0;
            t = c;
            return b | 0;
          } else {
            b = f[((f[a >> 2] | 0) + 896) >> 2] | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function _a(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 3943;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            b = 0;
            t = c;
            return b | 0;
          } else {
            b = f[((f[a >> 2] | 0) + 832) >> 2] | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function $a(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 3963;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            b = 0;
            t = c;
            return b | 0;
          } else {
            b = f[((f[a >> 2] | 0) + 876) >> 2] | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function ab(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 3990;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            b = 0;
            t = c;
            return b | 0;
          } else {
            b = f[(a + 272) >> 2] | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function bb(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 4020;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            b = 0;
            t = c;
            return b | 0;
          } else {
            b = f[((f[a >> 2] | 0) + 824) >> 2] | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function cb(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 4044;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            b = 0;
            t = c;
            return b | 0;
          } else {
            b = f[((f[a >> 2] | 0) + 888) >> 2] | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function db(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 4070;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            b = 0;
            t = c;
            return b | 0;
          } else {
            b = f[((f[a >> 2] | 0) + 828) >> 2] | 0;
            t = c;
            return b | 0;
          }
          return 0;
        }
        function eb(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          if (!a) {
            f[b >> 2] = 4092;
            f[(b + 4) >> 2] = 3294;
            wa(4, 3169, b);
            t = c;
            return;
          } else {
            f[(a + 256) >> 2] = 1;
            t = c;
            return;
          }
        }
        function fb(a, b) {
          a = a | 0;
          b = b | 0;
          var c = 0;
          c = +Q(+(+n[(a + 4) >> 2]), +(+n[a >> 2]));
          c = c - +Q(+(+n[(b + 4) >> 2]), +(+n[b >> 2]));
          if (c < -3.1415927410125732)
            do {
              c = c + 6.2831854820251465;
            } while (c < -3.1415927410125732);
          if (!(c > 3.1415927410125732)) return +c;
          do {
            c = c + -6.2831854820251465;
          } while (c > 3.1415927410125732);
          return +c;
        }
        function gb() {
          return 1;
        }
        function hb(a, c) {
          a = a | 0;
          c = c | 0;
          var d = 0;
          c = (a + c + -1) | 0;
          if (c >>> 0 <= a >>> 0) return;
          do {
            d = b[a >> 0] | 0;
            b[a >> 0] = b[c >> 0] | 0;
            a = (a + 1) | 0;
            b[c >> 0] = d;
            c = (c + -1) | 0;
          } while (c >>> 0 > a >>> 0);
          return;
        }
        function ib(a, c, d) {
          a = a | 0;
          c = c | 0;
          d = d | 0;
          var e = 0,
            f = 0,
            g = 0;
          if (!d) return;
          do {
            d = (d + -1) | 0;
            e = a;
            a = (a + c) | 0;
            f = (a + -1) | 0;
            if (f >>> 0 > e >>> 0)
              do {
                g = b[e >> 0] | 0;
                b[e >> 0] = b[f >> 0] | 0;
                e = (e + 1) | 0;
                b[f >> 0] = g;
                f = (f + -1) | 0;
              } while (f >>> 0 > e >>> 0);
          } while ((d | 0) != 0);
          return;
        }
        function jb() {
          return;
        }
        function kb(a) {
          a = a | 0;
          var b = 0,
            c = 0,
            d = 0,
            e = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0;
          m = f[(a + 4) >> 2] | 0;
          i = f[(a + 36) >> 2] | 0;
          e = f[(a + 24) >> 2] | 0;
          if ((e | 0) > 0) {
            g = f[(a + 28) >> 2] | 0;
            c = f[(a + 20) >> 2] | 0;
            d = f[(a + 32) >> 2] | 0;
            b = 0;
            do {
              n[(d + (b << 2)) >> 2] = +n[(g + (b << 2)) >> 2] * +n[(c + (b << 2)) >> 2];
              b = (b + 1) | 0;
            } while ((b | 0) != (e | 0));
          }
          if ((m | 0) <= 0) return;
          j = f[(a + 12) >> 2] | 0;
          k = (a + 16) | 0;
          l = (a + 44) | 0;
          a = (a + 32) | 0;
          g = 0;
          e = 0;
          while (1) {
            if (f[i >> 2] | 0) {
              d = f[((f[k >> 2] | 0) + (g << 2)) >> 2] | 0;
              c = (d + e) | 0;
              if ((d | 0) > 0) {
                d = f[a >> 2] | 0;
                h = 0;
                b = e;
                do {
                  h = h + +n[(d + (b << 2)) >> 2];
                  b = (b + 1) | 0;
                } while ((b | 0) < (c | 0));
              } else h = 0;
              f[((f[l >> 2] | 0) + (g << 2)) >> 2] = ~~(h + 0.0010000000474974513);
            }
            e = ((f[(j + (g << 2)) >> 2] | 0) + e) | 0;
            g = (g + 1) | 0;
            if ((g | 0) == (m | 0)) break;
            else i = (i + 4) | 0;
          }
          return;
        }
        function lb(a) {
          a = a | 0;
          var b = 0,
            c = 0,
            d = 0,
            e = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0;
          w = f[(a + 68) >> 2] | 0;
          x = f[(a + 64) >> 2] | 0;
          i = f[(a + 172) >> 2] | 0;
          g = f[(a + 92) >> 2] | 0;
          if ((g | 0) > 0) {
            c = f[(a + 96) >> 2] | 0;
            d = f[(a + 88) >> 2] | 0;
            e = f[(a + 104) >> 2] | 0;
            b = 0;
            do {
              n[(e + (b << 2)) >> 2] = +n[(c + (b << 2)) >> 2] * +n[(d + (b << 2)) >> 2];
              b = (b + 1) | 0;
            } while ((b | 0) != (g | 0));
          }
          if ((x | 0) <= 0) return;
          r = f[(a + 80) >> 2] | 0;
          s = (a + 84) | 0;
          t = (a + 104) | 0;
          u = (a + 108) | 0;
          v = (a + 100) | 0;
          q = (a + 88) | 0;
          p = 0;
          m = 0;
          while (1) {
            if (f[i >> 2] | 0) {
              d = f[((f[s >> 2] | 0) + (p << 2)) >> 2] | 0;
              o = (d + m) | 0;
              d = (d | 0) > 0;
              if (d) {
                c = f[t >> 2] | 0;
                b = m;
                h = 0;
                do {
                  h = h + +n[(c + (b << 2)) >> 2];
                  b = (b + 1) | 0;
                } while ((b | 0) < (o | 0));
              } else h = 0;
              n[(w + ((p * 24) | 0) + 16) >> 2] = h;
              b = f[(w + ((p * 24) | 0) + 12) >> 2] | 0;
              l = b << 1;
              b = (b | 0) > 0;
              if (b) Hc(f[(w + ((p * 24) | 0) + 20) >> 2] | 0, 0, (((l | 0) > 1 ? l : 1) << 2) | 0) | 0;
              if (d & b) {
                g = f[v >> 2] | 0;
                a = f[q >> 2] | 0;
                j = f[u >> 2] | 0;
                k = f[(w + ((p * 24) | 0) + 20) >> 2] | 0;
                e = m;
                do {
                  c = f[(g + (e << 2)) >> 2] | 0;
                  d = (a + (e << 2)) | 0;
                  b = 0;
                  do {
                    n[(j + (b << 2)) >> 2] = +n[(c + (b << 2)) >> 2] * +n[d >> 2];
                    b = (b + 1) | 0;
                  } while ((b | 0) < (l | 0));
                  b = 0;
                  do {
                    d = (k + (b << 2)) | 0;
                    n[d >> 2] = +n[(j + (b << 2)) >> 2] + +n[d >> 2];
                    b = (b + 1) | 0;
                  } while ((b | 0) < (l | 0));
                  e = (e + 1) | 0;
                } while ((e | 0) < (o | 0));
              }
            }
            m = ((f[(r + (p << 2)) >> 2] | 0) + m) | 0;
            p = (p + 1) | 0;
            if ((p | 0) == (x | 0)) break;
            else i = (i + 4) | 0;
          }
          return;
        }
        function mb(a) {
          a = a | 0;
          var b = 0,
            c = 0,
            d = 0,
            e = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0;
          s = f[(a + 76) >> 2] | 0;
          t = f[(a + 72) >> 2] | 0;
          r = f[(a + 176) >> 2] | 0;
          i = f[(a + 124) >> 2] | 0;
          h = (i | 0) > 0;
          if (h) {
            c = f[(a + 128) >> 2] | 0;
            d = f[(a + 120) >> 2] | 0;
            e = f[(a + 148) >> 2] | 0;
            b = 0;
            do {
              n[(e + (b << 2)) >> 2] = +n[(c + (b << 2)) >> 2] * +n[(d + (b << 2)) >> 2];
              b = (b + 1) | 0;
            } while ((b | 0) != (i | 0));
            if (h) {
              c = f[(a + 132) >> 2] | 0;
              d = f[(a + 120) >> 2] | 0;
              e = f[(a + 152) >> 2] | 0;
              b = 0;
              do {
                n[(e + (b << 2)) >> 2] = +n[(c + (b << 2)) >> 2] * +n[(d + (b << 2)) >> 2];
                b = (b + 1) | 0;
              } while ((b | 0) != (i | 0));
              if (h) {
                c = f[(a + 136) >> 2] | 0;
                d = f[(a + 120) >> 2] | 0;
                e = f[(a + 156) >> 2] | 0;
                b = 0;
                do {
                  n[(e + (b << 2)) >> 2] = +n[(c + (b << 2)) >> 2] * +n[(d + (b << 2)) >> 2];
                  b = (b + 1) | 0;
                } while ((b | 0) != (i | 0));
                if (h) {
                  c = f[(a + 140) >> 2] | 0;
                  d = f[(a + 120) >> 2] | 0;
                  e = f[(a + 160) >> 2] | 0;
                  b = 0;
                  do {
                    n[(e + (b << 2)) >> 2] = +n[(c + (b << 2)) >> 2] * +n[(d + (b << 2)) >> 2];
                    b = (b + 1) | 0;
                  } while ((b | 0) != (i | 0));
                  if (h) {
                    c = f[(a + 144) >> 2] | 0;
                    d = f[(a + 120) >> 2] | 0;
                    e = f[(a + 164) >> 2] | 0;
                    b = 0;
                    do {
                      n[(e + (b << 2)) >> 2] = +n[(c + (b << 2)) >> 2] * +n[(d + (b << 2)) >> 2];
                      b = (b + 1) | 0;
                    } while ((b | 0) != (i | 0));
                  }
                }
              }
            }
          }
          if ((t | 0) <= 0) return;
          k = f[(a + 112) >> 2] | 0;
          l = (a + 116) | 0;
          m = (a + 164) | 0;
          o = (a + 160) | 0;
          p = (a + 156) | 0;
          q = (a + 152) | 0;
          j = (a + 148) | 0;
          a = 0;
          h = r;
          i = 0;
          while (1) {
            if (f[h >> 2] | 0) {
              d = f[((f[l >> 2] | 0) + (a << 2)) >> 2] | 0;
              e = (d + i) | 0;
              d = (d | 0) > 0;
              if (d) {
                c = f[j >> 2] | 0;
                b = i;
                g = 0;
                do {
                  g = g + +n[(c + (b << 2)) >> 2];
                  b = (b + 1) | 0;
                } while ((b | 0) < (e | 0));
                n[(s + (a << 5) + 4) >> 2] = g;
                if (d) {
                  c = f[q >> 2] | 0;
                  b = i;
                  g = 0;
                  do {
                    g = g + +n[(c + (b << 2)) >> 2];
                    b = (b + 1) | 0;
                  } while ((b | 0) < (e | 0));
                  n[(s + (a << 5) + 20) >> 2] = g;
                  if (d) {
                    c = f[p >> 2] | 0;
                    b = i;
                    g = 0;
                    do {
                      g = g + +n[(c + (b << 2)) >> 2];
                      b = (b + 1) | 0;
                    } while ((b | 0) < (e | 0));
                    n[(s + (a << 5) + 12) >> 2] = g;
                    if (d) {
                      c = f[o >> 2] | 0;
                      b = i;
                      g = 0;
                      do {
                        g = g + +n[(c + (b << 2)) >> 2];
                        b = (b + 1) | 0;
                      } while ((b | 0) < (e | 0));
                      n[(s + (a << 5) + 16) >> 2] = g;
                      if (d) {
                        c = f[m >> 2] | 0;
                        g = 0;
                        b = i;
                        do {
                          g = g + +n[(c + (b << 2)) >> 2];
                          b = (b + 1) | 0;
                        } while ((b | 0) < (e | 0));
                      } else g = 0;
                    } else u = 34;
                  } else u = 30;
                } else u = 26;
              } else {
                n[(s + (a << 5) + 4) >> 2] = 0;
                u = 26;
              }
              if ((u | 0) == 26) {
                n[(s + (a << 5) + 20) >> 2] = 0;
                u = 30;
              }
              if ((u | 0) == 30) {
                n[(s + (a << 5) + 12) >> 2] = 0;
                u = 34;
              }
              if ((u | 0) == 34) {
                u = 0;
                n[(s + (a << 5) + 16) >> 2] = 0;
                g = 0;
              }
              n[(s + (a << 5) + 8) >> 2] = g;
            }
            i = ((f[(k + (a << 2)) >> 2] | 0) + i) | 0;
            a = (a + 1) | 0;
            if ((a | 0) == (t | 0)) break;
            else h = (h + 4) | 0;
          }
          return;
        }
        function nb(a) {
          a = a | 0;
          var b = 0,
            c = 0,
            d = 0,
            e = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0,
            y = 0,
            z = 0,
            A = 0,
            B = 0;
          A = f[(a + 204) >> 2] | 0;
          B = f[(a + 200) >> 2] | 0;
          j = f[(a + 248) >> 2] | 0;
          h = f[(a + 220) >> 2] | 0;
          g = (h | 0) > 0;
          if (g) {
            c = f[(a + 224) >> 2] | 0;
            d = f[(a + 216) >> 2] | 0;
            e = f[(a + 236) >> 2] | 0;
            b = 0;
            do {
              n[(e + (b << 2)) >> 2] = +n[(c + (b << 2)) >> 2] * +n[(d + (b << 2)) >> 2];
              b = (b + 1) | 0;
            } while ((b | 0) != (h | 0));
            if (g) {
              c = f[(a + 228) >> 2] | 0;
              d = f[(a + 216) >> 2] | 0;
              e = f[(a + 240) >> 2] | 0;
              b = 0;
              do {
                n[(e + (b << 2)) >> 2] = +n[(c + (b << 2)) >> 2] * +n[(d + (b << 2)) >> 2];
                b = (b + 1) | 0;
              } while ((b | 0) != (h | 0));
            }
          }
          if ((B | 0) <= 0) return;
          r = f[(a + 208) >> 2] | 0;
          s = (a + 212) | 0;
          t = (a + 236) | 0;
          u = (a + 276) | 0;
          v = (a + 240) | 0;
          w = (a + 268) | 0;
          x = (a + 272) | 0;
          y = (a + 244) | 0;
          z = (a + 232) | 0;
          q = (a + 216) | 0;
          p = 0;
          m = 0;
          while (1) {
            if (f[j >> 2] | 0) {
              d = f[((f[s >> 2] | 0) + (p << 2)) >> 2] | 0;
              o = (d + m) | 0;
              d = (d | 0) > 0;
              if (d) {
                c = f[t >> 2] | 0;
                b = m;
                i = 0;
                do {
                  i = i + +n[(c + (b << 2)) >> 2];
                  b = (b + 1) | 0;
                } while ((b | 0) < (o | 0));
                n[((f[u >> 2] | 0) + (p << 2)) >> 2] = i;
                if (d) {
                  c = f[v >> 2] | 0;
                  b = m;
                  i = 0;
                  do {
                    i = i + +n[(c + (b << 2)) >> 2];
                    b = (b + 1) | 0;
                  } while ((b | 0) < (o | 0));
                } else i = 0;
              } else {
                n[((f[u >> 2] | 0) + (p << 2)) >> 2] = 0;
                i = 0;
              }
              f[((f[w >> 2] | 0) + (p << 2)) >> 2] = ~~(i + 0.0010000000474974513);
              b = f[(A + (p << 4) + 12) >> 2] | 0;
              k = b << 1;
              l = f[((f[x >> 2] | 0) + (p << 2)) >> 2] | 0;
              b = (b | 0) > 0;
              if (b) Hc(l | 0, 0, (((k | 0) > 1 ? k : 1) << 2) | 0) | 0;
              if (d & b) {
                g = f[z >> 2] | 0;
                h = f[q >> 2] | 0;
                a = f[y >> 2] | 0;
                e = m;
                do {
                  c = f[(g + (e << 2)) >> 2] | 0;
                  d = (h + (e << 2)) | 0;
                  b = 0;
                  do {
                    n[(a + (b << 2)) >> 2] = +n[(c + (b << 2)) >> 2] * +n[d >> 2];
                    b = (b + 1) | 0;
                  } while ((b | 0) < (k | 0));
                  b = 0;
                  do {
                    d = (l + (b << 2)) | 0;
                    n[d >> 2] = +n[(a + (b << 2)) >> 2] + +n[d >> 2];
                    b = (b + 1) | 0;
                  } while ((b | 0) < (k | 0));
                  e = (e + 1) | 0;
                } while ((e | 0) < (o | 0));
              }
            }
            m = ((f[(r + (p << 2)) >> 2] | 0) + m) | 0;
            p = (p + 1) | 0;
            if ((p | 0) == (B | 0)) break;
            else j = (j + 4) | 0;
          }
          return;
        }
        function ob(a, b, c, d) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          var e = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            o = 0,
            q = 0,
            r = 0,
            s = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0,
            y = 0,
            z = 0,
            A = 0,
            B = 0,
            C = 0,
            D = 0,
            E = 0,
            F = 0,
            G = 0,
            H = 0,
            I = 0,
            J = 0,
            K = 0,
            L = 0,
            M = 0,
            N = 0,
            O = 0,
            P = 0,
            Q = 0,
            R = 0,
            S = 0,
            T = 0,
            V = 0,
            W = 0,
            X = 0,
            Y = 0,
            Z = 0,
            _ = 0,
            $ = 0,
            aa = 0,
            ba = 0,
            ca = 0,
            da = 0,
            ea = 0;
          ca = t;
          t = (t + 32) | 0;
          ba = ca;
          Z = f[(a + 20) >> 2] | 0;
          _ = f[(a + 4) >> 2] | 0;
          $ = f[a >> 2] | 0;
          aa = (_ + 1) | 0;
          if ((d | 0) <= 0) {
            t = ca;
            return;
          }
          X = +(_ | 0);
          Y = +($ | 0);
          L = (f[(a + 8) >> 2] | 0) == 0;
          M = (Z + (_ << 3)) | 0;
          N = U($, aa) | 0;
          O = (Z + (N << 3)) | 0;
          T = (N + _) | 0;
          P = (Z + (T << 3)) | 0;
          Q = (Z + 4) | 0;
          R = (Z + (_ << 3) + 4) | 0;
          S = (Z + (N << 3) + 4) | 0;
          T = (Z + (T << 3) + 4) | 0;
          V = (_ + -1) | 0;
          W = ($ + -1) | 0;
          C = 0;
          K = 0;
          s = 0;
          u = 0;
          e = 0;
          g = 0;
          A = 0;
          y = 0;
          x = 0;
          h = 0;
          G = 0;
          H = 0;
          I = 0;
          J = 0;
          v = 0;
          r = 0;
          D = 0;
          j = 0;
          while (1) {
            k = +n[(b + (K << 3)) >> 2];
            z = +n[(b + (K << 3) + 4) >> 2];
            i = X * k;
            B = Y * z;
            q = !(k >= 1);
            w = !(z >= 1);
            do {
              if (w & (q & (!(k < 0) & !(z < 0)))) {
                w = ~~i;
                a = ~~B;
                q = ((U(a, aa) | 0) + w) | 0;
                h = i - +(w | 0);
                z = B - +(a | 0);
                a = (q + aa) | 0;
                w = (q + 1) | 0;
                o = 1 - h;
                i = +n[(Z + (a << 3) + 4) >> 2];
                k = +n[(Z + (a << 3)) >> 2];
                j = +n[(Z + (w << 3) + 4) >> 2];
                l = +n[(Z + (w << 3)) >> 2];
                if (!L) {
                  B = 1 - z;
                  w = (a + 1) | 0;
                  n[(c + (K << 3)) >> 2] = z * (h * +n[(Z + (w << 3)) >> 2]) + (z * (o * k) + (B * (h * l) + B * (o * +n[(Z + (q << 3)) >> 2])));
                  B = z * (h * +n[(Z + (w << 3) + 4) >> 2]) + (z * (o * i) + (B * (h * j) + B * (o * +n[(Z + (q << 3) + 4) >> 2])));
                  l = G;
                  m = H;
                  k = I;
                  i = J;
                  o = D;
                  j = z;
                  break;
                }
                if (!(h + z <= 1)) {
                  w = (a + 1) | 0;
                  F = h + -1 + z;
                  E = 1 - z;
                  m = o * i + F * +n[(Z + (w << 3) + 4) >> 2];
                  j = E * j;
                  i = E * l + (o * k + F * +n[(Z + (w << 3)) >> 2]);
                } else {
                  F = o - z;
                  m = h * j + F * +n[(Z + (q << 3) + 4) >> 2];
                  j = z * i;
                  i = z * k + (h * l + F * +n[(Z + (q << 3)) >> 2]);
                }
                n[(c + (K << 3)) >> 2] = i;
                B = j + m;
                l = G;
                m = H;
                k = I;
                i = J;
                o = D;
                j = z;
              } else {
                if (!C) {
                  ea = +n[Z >> 2];
                  da = +n[M >> 2];
                  l = +n[O >> 2];
                  v = +n[P >> 2];
                  m = +n[Q >> 2];
                  x = +n[R >> 2];
                  y = +n[S >> 2];
                  D = +n[T >> 2];
                  F = v - ea;
                  o = D - m;
                  E = da - l;
                  r = x - y;
                  C = 1;
                  A = (F - E) * 0.5;
                  E = (E + F) * 0.5;
                  F = (ea + da + l + v) * 0.25 - F * 0.5;
                  v = (o - r) * 0.5;
                  r = (r + o) * 0.5;
                  o = (m + x + y + D) * 0.25 - o * 0.5;
                } else {
                  E = y;
                  F = x;
                  o = D;
                }
                do {
                  if ((z < 3) & ((k > -2) & (k < 3) & (z > -2))) {
                    a = z <= 0;
                    do {
                      if (!(k <= 0))
                        if (q) {
                          if (a) {
                            q = ~~i;
                            q = (q | 0) == (_ | 0) ? V : q;
                            h = +(q | 0);
                            j = h / X;
                            w = (q + 1) | 0;
                            l = +(w | 0) / X;
                            u = A * 2;
                            k = v * 2;
                            s = j * E + F - u;
                            u = l * E + F - u;
                            e = +n[(Z + (q << 3)) >> 2];
                            g = +n[(Z + (w << 3)) >> 2];
                            h = i - h;
                            l = l * r + o - k;
                            m = +n[(Z + (q << 3) + 4) >> 2];
                            k = j * r + o - k;
                            i = +n[(Z + (w << 3) + 4) >> 2];
                            j = (z + 2) * 0.5;
                            break;
                          }
                          if (w) {
                            f[ba >> 2] = K;
                            p[(ba + 8) >> 3] = k;
                            p[(ba + 16) >> 3] = z;
                            wa(4, 4121, ba);
                            l = G;
                            m = H;
                            k = I;
                            i = J;
                            break;
                          } else {
                            w = ~~i;
                            w = (w | 0) == (_ | 0) ? V : w;
                            h = +(w | 0);
                            m = h / X;
                            q = (w + 1) | 0;
                            j = +(q | 0) / X;
                            w = (w + N) | 0;
                            q = (q + N) | 0;
                            g = A * 3;
                            ea = v * 3;
                            s = +n[(Z + (w << 3)) >> 2];
                            u = +n[(Z + (q << 3)) >> 2];
                            e = g + (m * E + F);
                            g = g + (j * E + F);
                            h = i - h;
                            l = +n[(Z + (q << 3) + 4) >> 2];
                            m = ea + (m * r + o);
                            k = +n[(Z + (w << 3) + 4) >> 2];
                            i = ea + (j * r + o);
                            j = (z + -1) * 0.5;
                            break;
                          }
                        } else {
                          i = r * 3 + o;
                          g = E * 3 + F;
                          h = (k + -1) * 0.5;
                          if (a) {
                            u = A * 2;
                            k = v * 2;
                            s = E + F - u;
                            u = g - u;
                            e = +n[M >> 2];
                            l = i - k;
                            m = +n[R >> 2];
                            k = r + o - k;
                            j = (z + 2) * 0.5;
                            break;
                          }
                          if (w) {
                            w = ~~B;
                            w = (w | 0) == ($ | 0) ? W : w;
                            j = +(w | 0);
                            l = j / Y;
                            q = (w + 1) | 0;
                            ea = +(q | 0) / Y;
                            w = ((U(w, aa) | 0) + _) | 0;
                            q = ((U(q, aa) | 0) + _) | 0;
                            s = +n[(Z + (w << 3)) >> 2];
                            u = l * A + g;
                            e = +n[(Z + (q << 3)) >> 2];
                            g = ea * A + g;
                            l = l * v + i;
                            m = +n[(Z + (q << 3) + 4) >> 2];
                            k = +n[(Z + (w << 3) + 4) >> 2];
                            i = ea * v + i;
                            j = B - j;
                            break;
                          } else {
                            l = A * 3;
                            j = v * 3;
                            s = +n[P >> 2];
                            u = A + g;
                            e = l + (E + F);
                            g = l + g;
                            l = v + i;
                            m = j + (r + o);
                            k = +n[T >> 2];
                            i = j + i;
                            j = (z + -1) * 0.5;
                            break;
                          }
                        }
                      else {
                        i = o - r * 2;
                        e = F - E * 2;
                        h = (k + 2) * 0.5;
                        if (a) {
                          u = A * 2;
                          k = v * 2;
                          s = e - u;
                          u = F - u;
                          g = +n[Z >> 2];
                          l = o - k;
                          m = i;
                          k = i - k;
                          i = +n[Q >> 2];
                          j = (z + 2) * 0.5;
                          break;
                        }
                        if (w) {
                          q = ~~B;
                          q = (q | 0) == ($ | 0) ? W : q;
                          j = +(q | 0);
                          k = j / Y;
                          w = (q + 1) | 0;
                          m = +(w | 0) / Y;
                          q = U(q, aa) | 0;
                          w = U(w, aa) | 0;
                          s = k * A + e;
                          u = +n[(Z + (q << 3)) >> 2];
                          e = m * A + e;
                          g = +n[(Z + (w << 3)) >> 2];
                          l = +n[(Z + (q << 3) + 4) >> 2];
                          m = m * v + i;
                          k = k * v + i;
                          i = +n[(Z + (w << 3) + 4) >> 2];
                          j = B - j;
                          break;
                        } else {
                          g = A * 3;
                          j = v * 3;
                          s = A + e;
                          u = +n[O >> 2];
                          e = g + e;
                          g = g + F;
                          l = +n[S >> 2];
                          m = j + i;
                          k = v + i;
                          i = j + o;
                          j = (z + -1) * 0.5;
                          break;
                        }
                      }
                    } while (0);
                    if (!(h + j <= 1)) {
                      y = 1 - h;
                      x = 1 - j;
                      n[(c + (K << 3)) >> 2] = g + (e - g) * y + (u - g) * x;
                      y = i + (m - i) * y;
                      x = (l - i) * x;
                      break;
                    } else {
                      n[(c + (K << 3)) >> 2] = s + (u - s) * h + (e - s) * j;
                      y = k + (l - k) * h;
                      x = (m - k) * j;
                      break;
                    }
                  } else {
                    n[(c + (K << 3)) >> 2] = z * A + (k * E + F);
                    y = k * r + o;
                    x = z * v;
                    l = G;
                    m = H;
                    k = I;
                    i = J;
                  }
                } while (0);
                B = x + y;
                y = E;
                x = F;
              }
            } while (0);
            n[(c + (K << 3) + 4) >> 2] = B;
            K = (K + 1) | 0;
            if ((K | 0) == (d | 0)) break;
            else {
              G = l;
              H = m;
              I = k;
              J = i;
              D = o;
            }
          }
          t = ca;
          return;
        }
        function pb(a, b, c, d) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          var e = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0;
          k = ((+n[a >> 2] + +n[(a + 20) >> 2]) * 3.1415927410125732) / 180;
          h = +L(+k);
          k = +K(+k);
          e = +n[(a + 8) >> 2];
          i = f[(a + 24) >> 2] | 0 ? -1 : 1;
          j = f[(a + 28) >> 2] | 0 ? -1 : 1;
          k = k * e;
          g = k * i;
          e = h * e;
          h = e * j;
          i = e * i;
          j = k * j;
          k = +n[(a + 12) >> 2];
          e = +n[(a + 16) >> 2];
          if ((d | 0) <= 0) return;
          a = 0;
          do {
            m = +n[(b + (a << 3)) >> 2];
            l = +n[(b + (a << 3) + 4) >> 2];
            n[(c + (a << 3)) >> 2] = k + (g * m - h * l);
            n[(c + (a << 3) + 4) >> 2] = e + (i * m + j * l);
            a = (a + 1) | 0;
          } while ((a | 0) != (d | 0));
          return;
        }
        function qb(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          var d = 0,
            e = 0,
            g = 0,
            h = 0,
            i = 0;
          e = f[(a + 24) >> 2] | 0;
          g = f[(c + 136) >> 2] | 0;
          h = f[(c + 140) >> 2] | 0;
          d = (a + 4) | 0;
          a = f[d >> 2] | 0;
          if ((a | 0) == -1) {
            f[(g + (b << 2)) >> 2] = f[(e + 16) >> 2];
            n[(h + (b << 2)) >> 2] = 1;
            return;
          } else {
            i = f[(c + 4) >> 2] | 0;
            c = f[(e + 20) >> 2] | 0;
            qa[f[(i + (a << 5) + 20) >> 2] & 3](f[(i + (a << 5) + 24) >> 2] | 0, c, c, f[(e + 12) >> 2] | 0);
            c = f[d >> 2] | 0;
            n[(g + (b << 2)) >> 2] = +n[(e + 16) >> 2] * +n[(g + (c << 2)) >> 2];
            f[(h + (b << 2)) >> 2] = f[(h + (c << 2)) >> 2];
            return;
          }
        }
        function rb(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          var d = 0,
            e = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0,
            y = 0,
            z = 0,
            A = 0,
            B = 0,
            C = 0,
            D = 0,
            E = 0,
            F = 0,
            G = 0;
          E = t;
          t = (t + 64) | 0;
          D = (E + 24) | 0;
          s = (E + 16) | 0;
          u = (E + 56) | 0;
          z = (E + 8) | 0;
          v = (E + 48) | 0;
          A = (E + 40) | 0;
          B = (E + 32) | 0;
          C = E;
          w = f[(a + 24) >> 2] | 0;
          x = f[(c + 136) >> 2] | 0;
          y = f[(c + 140) >> 2] | 0;
          r = (a + 4) | 0;
          a = f[r >> 2] | 0;
          if ((a | 0) == -1) {
            f[(x + (b << 2)) >> 2] = f[(w + 4) >> 2];
            f[(y + (b << 2)) >> 2] = f[(w + 8) >> 2];
            t = E;
            return;
          }
          l = f[(c + 4) >> 2] | 0;
          m = (w + 12) | 0;
          j = f[m >> 2] | 0;
          f[A >> 2] = j;
          o = (A + 4) | 0;
          p = (w + 16) | 0;
          q = f[p >> 2] | 0;
          f[o >> 2] = q;
          n[B >> 2] = 0;
          k = (f[(l + (a << 5) + 8) >> 2] | 0) == 1 ? -10 : -0.10000000149011612;
          n[(B + 4) >> 2] = k;
          f[s >> 2] = j;
          j = (s + 4) | 0;
          f[j >> 2] = q;
          q = (l + (a << 5) + 20) | 0;
          l = (l + (a << 5) + 24) | 0;
          qa[f[q >> 2] & 3](f[l >> 2] | 0, s, u, 1);
          a = (v + 4) | 0;
          c = (u + 4) | 0;
          h = (z + 4) | 0;
          g = 1;
          i = 9;
          while (1) {
            d = g * 0;
            n[v >> 2] = d + +n[s >> 2];
            e = k * g;
            n[a >> 2] = e + +n[j >> 2];
            qa[f[q >> 2] & 3](f[l >> 2] | 0, v, z, 1);
            G = +n[z >> 2] - +n[u >> 2];
            n[z >> 2] = G;
            F = +n[h >> 2] - +n[c >> 2];
            n[h >> 2] = F;
            if ((G != 0) | (F != 0)) {
              a = 5;
              break;
            }
            n[v >> 2] = +n[s >> 2] - d;
            n[a >> 2] = +n[j >> 2] - e;
            qa[f[q >> 2] & 3](f[l >> 2] | 0, v, z, 1);
            d = +n[z >> 2] - +n[u >> 2];
            n[z >> 2] = d;
            e = +n[h >> 2] - +n[c >> 2];
            n[h >> 2] = e;
            if ((d != 0) | (e != 0)) {
              a = 7;
              break;
            }
            if (!i) {
              a = 9;
              break;
            } else {
              g = g * 0.10000000149011612;
              i = (i + -1) | 0;
            }
          }
          if ((a | 0) == 5) {
            v = z;
            z = f[(v + 4) >> 2] | 0;
            D = C;
            f[D >> 2] = f[v >> 2];
            f[(D + 4) >> 2] = z;
          } else if ((a | 0) == 7) {
            n[C >> 2] = -d;
            n[(C + 4) >> 2] = -e;
          } else if ((a | 0) == 9) wa(3, 4193, D);
          G = (+fb(B, C) * 180) / 3.1415927410125732;
          qa[f[q >> 2] & 3](f[l >> 2] | 0, A, A, 1);
          f[m >> 2] = f[A >> 2];
          f[p >> 2] = f[o >> 2];
          C = (w + 20) | 0;
          n[C >> 2] = +n[C >> 2] - G;
          C = f[r >> 2] | 0;
          n[(x + (b << 2)) >> 2] = +n[(w + 4) >> 2] * +n[(x + (C << 2)) >> 2];
          D = (w + 8) | 0;
          G = +n[D >> 2] * +n[(y + (C << 2)) >> 2];
          n[(y + (b << 2)) >> 2] = G;
          n[D >> 2] = G;
          t = E;
          return;
        }
        function sb(a) {
          a = a | 0;
          var b = 0,
            c = 0,
            d = 0,
            e = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0;
          b = f[a >> 2] | 0;
          n = f[(a + 316) >> 2] | 0;
          r = f[(b + 1072) >> 2] | 0;
          t = f[(a + 340) >> 2] | 0;
          if ((t | 0) <= 0) return;
          k = (a + 356) | 0;
          l = (a + 364) | 0;
          i = (b + 1104) | 0;
          j = (a + 352) | 0;
          d = f[(a + 372) >> 2] | 0;
          e = 0;
          g = 0;
          while (1) {
            h = f[d >> 2] | 0;
            b = (n + ((h * 36) | 0) + 24) | 0;
            if (!((f[b >> 2] | 0) == 0 ? !(f[(n + ((h * 36) | 0) + 28) >> 2] | 0) : 0)) u = 6;
            if (((u | 0) == 6 ? ((u = 0), (f[((f[j >> 2] | 0) + (g << 2)) >> 2] = f[(n + ((h * 36) | 0) + 8) >> 2]), f[b >> 2] | 0) : 0) ? ((m = f[(r + (g << 2)) >> 2] | 0), (o = f[(n + ((h * 36) | 0) + 16) >> 2] | 0), (c = f[(n + ((h * 36) | 0) + 8) >> 2] | 0), (p = (o + (c << 2)) | 0), (c | 0) > 0) : 0) {
              c = f[i >> 2] | 0;
              b = ((f[l >> 2] | 0) + (e << 2)) | 0;
              a = o;
              while (1) {
                f[b >> 2] = f[(c + (((f[a >> 2] | 0) + m) << 2)) >> 2];
                a = (a + 4) | 0;
                if (a >>> 0 >= p >>> 0) break;
                else b = (b + 4) | 0;
              }
            }
            if (f[(n + ((h * 36) | 0) + 28) >> 2] | 0 ? ((q = f[(n + ((h * 36) | 0) + 20) >> 2] | 0), (c = f[(n + ((h * 36) | 0) + 8) >> 2] | 0), (s = (q + (c << 2)) | 0), (c | 0) > 0) : 0) {
              b = q;
              a = ((f[k >> 2] | 0) + (e << 2)) | 0;
              while (1) {
                f[a >> 2] = f[b >> 2];
                b = (b + 4) | 0;
                if (b >>> 0 >= s >>> 0) break;
                else a = (a + 4) | 0;
              }
            }
            g = (g + 1) | 0;
            if ((g | 0) == (t | 0)) break;
            else {
              d = (d + 4) | 0;
              e = ((f[(n + ((h * 36) | 0) + 4) >> 2] | 0) + e) | 0;
            }
          }
          return;
        }
        function tb(a) {
          a = a | 0;
          var b = 0,
            c = 0,
            d = 0,
            e = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0;
          l = f[(a + 340) >> 2] | 0;
          d = f[(a + 360) >> 2] | 0;
          if ((d | 0) > 0) {
            e = f[(a + 364) >> 2] | 0;
            g = f[(a + 356) >> 2] | 0;
            c = f[(a + 368) >> 2] | 0;
            b = 0;
            do {
              n[(c + (b << 2)) >> 2] = +n[(e + (b << 2)) >> 2] * +n[(g + (b << 2)) >> 2];
              b = (b + 1) | 0;
            } while ((b | 0) != (d | 0));
          }
          if ((l | 0) <= 0) return;
          i = f[(a + 352) >> 2] | 0;
          j = f[(a + 344) >> 2] | 0;
          k = f[(a + 348) >> 2] | 0;
          a = (a + 368) | 0;
          e = 0;
          g = 0;
          do {
            d = f[(i + (e << 2)) >> 2] | 0;
            c = (d + g) | 0;
            if ((d | 0) > 0) {
              d = f[a >> 2] | 0;
              h = 0;
              b = g;
              do {
                h = h + +n[(d + (b << 2)) >> 2];
                b = (b + 1) | 0;
              } while ((b | 0) < (c | 0));
            } else h = 0;
            n[(j + ((e * 24) | 0) + 20) >> 2] = h;
            g = ((f[(k + (e << 2)) >> 2] | 0) + g) | 0;
            e = (e + 1) | 0;
          } while ((e | 0) != (l | 0));
          return;
        }
        function ub(a) {
          a = a | 0;
          var b = 0,
            c = 0,
            d = 0,
            e = 0,
            g = 0,
            h = 0,
            i = 0,
            k = 0,
            l = 0,
            m = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            t = 0,
            u = 0,
            v = 0,
            w = 0;
          b = f[(a + 344) >> 2] | 0;
          k = f[(a + 340) >> 2] | 0;
          l = (b + ((k * 24) | 0)) | 0;
          if ((k | 0) <= 0) return;
          k = f[(a + 272) >> 2] | 0;
          do {
            c = f[(b + 8) >> 2] | 0;
            d = f[(k + (f[b >> 2] << 2)) >> 2] | 0;
            e = f[(k + (f[(b + 4) >> 2] << 2)) >> 2] | 0;
            g = f[(b + 12) >> 2] | 0;
            h = f[(b + 16) >> 2] | 0;
            i = +n[(b + 20) >> 2];
            if ((c | 0) > 0) {
              a = 0;
              do {
                m = a | 1;
                v = +n[(g + (a << 2)) >> 2];
                q = +n[(g + (m << 2)) >> 2];
                u = ((j[(h + (a << 1)) >> 1] | 0) << 1) & 65534;
                w = (d + (u << 2)) | 0;
                t = +n[w >> 2];
                u = (d + ((u | 1) << 2)) | 0;
                p = +n[u >> 2];
                m = ((j[(h + (m << 1)) >> 1] | 0) << 1) & 65534;
                r = (e + (m << 2)) | 0;
                s = +n[r >> 2];
                m = (e + ((m | 1) << 2)) | 0;
                o = +n[m >> 2];
                n[w >> 2] = t + i * (v * (s - t));
                n[u >> 2] = p + i * (v * (o - p));
                n[r >> 2] = s + i * (q * (t - s));
                n[m >> 2] = o + i * (q * (p - o));
                a = (a + 2) | 0;
              } while ((a | 0) < (c | 0));
            }
            b = (b + 24) | 0;
          } while (b >>> 0 < l >>> 0);
          return;
        }
        function vb(a) {
          a = a | 0;
          var b = 0,
            c = 0,
            d = 0,
            e = 0,
            g = 0,
            h = 0,
            i = 0;
          if (f[(a + 380) >> 2] | 0) return;
          b = f[(a + 204) >> 2] | 0;
          d = f[(a + 200) >> 2] | 0;
          h = (b + (d << 4)) | 0;
          if ((d | 0) <= 0) return;
          d = f[(a + 248) >> 2] | 0;
          c = f[(a + 272) >> 2] | 0;
          a = b;
          while (1) {
            if (f[d >> 2] | 0 ? ((e = f[c >> 2] | 0), (g = f[(a + 12) >> 2] << 1), (g | 0) > 1) : 0) {
              b = 1;
              do {
                i = (e + (b << 2)) | 0;
                n[i >> 2] = -+n[i >> 2];
                b = (b + 2) | 0;
              } while ((b | 0) < (g | 0));
            }
            a = (a + 16) | 0;
            if (a >>> 0 >= h >>> 0) break;
            else {
              d = (d + 4) | 0;
              c = (c + 4) | 0;
            }
          }
          return;
        }
        function wb(a) {
          a = a | 0;
          var c = 0,
            d = 0,
            e = 0,
            g = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0,
            y = 0,
            z = 0,
            A = 0,
            B = 0,
            C = 0,
            D = 0,
            E = 0,
            F = 0,
            H = 0,
            I = 0,
            J = 0,
            K = 0,
            L = 0,
            M = 0,
            N = 0,
            O = 0,
            P = 0,
            Q = 0,
            R = 0,
            S = 0,
            T = 0,
            V = 0,
            W = 0,
            X = 0,
            Y = 0,
            Z = 0,
            _ = 0,
            $ = 0,
            aa = 0,
            ba = 0,
            ca = 0,
            da = 0,
            ea = 0,
            fa = 0,
            ga = 0,
            ha = 0,
            ia = 0,
            ja = 0,
            ka = 0,
            la = 0,
            ma = 0,
            na = 0,
            oa = 0,
            ra = 0,
            sa = 0,
            ta = 0,
            ua = 0;
          ta = t;
          t = (t + 16) | 0;
          K = ta;
          sa = (a + 256) | 0;
          if (f[sa >> 2] | 0) {
            na = f[(a + 200) >> 2] << 2;
            Gc(f[(a + 280) >> 2] | 0, f[(a + 264) >> 2] | 0, na | 0) | 0;
            Gc(f[(a + 284) >> 2] | 0, f[(a + 268) >> 2] | 0, na | 0) | 0;
            Gc(f[(a + 288) >> 2] | 0, f[(a + 276) >> 2] | 0, na | 0) | 0;
          }
          i = f[(a + 292) >> 2] | 0;
          k = f[(a + 296) >> 2] | 0;
          u = (k + ((i * 40) | 0)) | 0;
          i = (i | 0) > 0;
          if (i) {
            e = f[(a + 300) >> 2] | 0;
            g = k;
            while (1) {
              q = +n[e >> 2];
              j = (f[(g + 12) >> 2] | 0) == 0;
              if (j) {
                V = +n[g >> 2];
                W = +n[(g + 4) >> 2];
                q = q < V ? V : q > W ? W : q;
              } else {
                W = +n[(g + 8) >> 2];
                V = +n[g >> 2];
                q = (q - V) / W;
                q = V + W * (q - +(~~+G(+q) | 0));
              }
              c = (g + 32) | 0;
              d = (g + 36) | 0;
              if (+n[c >> 2] != q) {
                f[d >> 2] = 1;
                n[c >> 2] = q;
              } else f[d >> 2] = 0;
              if (j) n[e >> 2] = q;
              g = (g + 40) | 0;
              if (g >>> 0 >= u >>> 0) break;
              else e = (e + 4) | 0;
            }
            if (i) {
              p = (a + 376) | 0;
              w = f[p >> 2] | 0;
              r = f[(a + 308) >> 2] | 0;
              s = (w | 0) == 0;
              while (1) {
                T = +n[(k + 32) >> 2];
                V = +n[(k + 16) >> 2];
                W = +n[(k + 20) >> 2];
                c = (r + (((f[(k + 24) >> 2] | 0) * 28) | 0)) | 0;
                na = f[(k + 28) >> 2] | 0;
                o = (c + ((na * 28) | 0)) | 0;
                a: do {
                  if ((na | 0) > 0) {
                    if (!s)
                      while (1) {
                        i = f[c >> 2] | 0;
                        do {
                          if ((i | 0) >= 1) {
                            e = f[(c + 4) >> 2] | 0;
                            A = +n[e >> 2];
                            q = A - V;
                            if ((i | 0) == 1) {
                              g = !(T < V + A) | !(q < T);
                              i = 0;
                              q = 0;
                              ga = 55;
                              break;
                            }
                            if (T < q) {
                              d = 1;
                              q = 0;
                              m = 0;
                              e = (c + 16) | 0;
                              ga = 57;
                              break;
                            }
                            if (!(T < V + A)) {
                              d = 1;
                              while (1) {
                                q = +n[(e + (d << 2)) >> 2];
                                if (T < V + q) {
                                  ga = 50;
                                  break;
                                }
                                d = (d + 1) | 0;
                                if ((d | 0) < (i | 0)) A = q;
                                else {
                                  e = 1;
                                  d = 0;
                                  q = 0;
                                  break;
                                }
                              }
                              if ((ga | 0) == 50)
                                if (!(q - V < T)) {
                                  d = (d + -1) | 0;
                                  q = q - A;
                                  if (q < W) {
                                    e = 0;
                                    q = 0;
                                  } else {
                                    e = 0;
                                    q = (T - A) / q;
                                  }
                                } else {
                                  e = 0;
                                  q = 0;
                                }
                              g = e;
                              i = e ? (i + -1) | 0 : d;
                              q = e ? 0 : q;
                              ga = 55;
                            } else {
                              g = 0;
                              i = 0;
                              q = 0;
                              ga = 55;
                            }
                          } else {
                            g = 0;
                            i = 0;
                            q = 0;
                            ga = 55;
                          }
                        } while (0);
                        if ((ga | 0) == 55) {
                          ga = 0;
                          d = g & 1;
                          e = (c + 16) | 0;
                          if (g | ((f[e >> 2] | 0) == 0)) {
                            m = i;
                            ga = 57;
                          } else {
                            g = 1;
                            m = i;
                            l = (c + 12) | 0;
                            j = (c + 8) | 0;
                            i = 1;
                          }
                        }
                        if ((ga | 0) == 57) {
                          ga = 0;
                          l = (c + 12) | 0;
                          A = +n[l >> 2];
                          na = A != q;
                          i = na & 1;
                          j = (c + 8) | 0;
                          g = (f[j >> 2] | 0) != (m | 0);
                          if (na) g = (q == 0) | (A == 0) | g;
                        }
                        f[(c + 24) >> 2] = i;
                        f[(c + 20) >> 2] = g & 1;
                        n[l >> 2] = q;
                        f[j >> 2] = m;
                        f[e >> 2] = d;
                        c = (c + 28) | 0;
                        if (c >>> 0 >= o >>> 0) break a;
                      }
                    if (!(f[(k + 36) >> 2] | 0))
                      while (1) {
                        f[(c + 24) >> 2] = 0;
                        f[(c + 20) >> 2] = 0;
                        c = (c + 28) | 0;
                        if (c >>> 0 >= o >>> 0) break a;
                      }
                    do {
                      i = f[c >> 2] | 0;
                      do {
                        if ((i | 0) >= 1) {
                          e = f[(c + 4) >> 2] | 0;
                          A = +n[e >> 2];
                          q = A - V;
                          if ((i | 0) == 1) {
                            g = !(T < V + A) | !(q < T);
                            i = 0;
                            q = 0;
                            ga = 37;
                            break;
                          }
                          if (T < q) {
                            d = 1;
                            q = 0;
                            m = 0;
                            e = (c + 16) | 0;
                            ga = 39;
                            break;
                          }
                          if (!(T < V + A)) {
                            d = 1;
                            while (1) {
                              q = +n[(e + (d << 2)) >> 2];
                              if (T < V + q) {
                                ga = 31;
                                break;
                              }
                              d = (d + 1) | 0;
                              if ((d | 0) < (i | 0)) A = q;
                              else {
                                e = 1;
                                d = 0;
                                q = 0;
                                break;
                              }
                            }
                            if ((ga | 0) == 31)
                              if (!(q - V < T)) {
                                d = (d + -1) | 0;
                                q = q - A;
                                if (q < W) {
                                  e = 0;
                                  q = 0;
                                } else {
                                  e = 0;
                                  q = (T - A) / q;
                                }
                              } else {
                                e = 0;
                                q = 0;
                              }
                            g = e;
                            i = e ? (i + -1) | 0 : d;
                            q = e ? 0 : q;
                            ga = 37;
                          } else {
                            g = 0;
                            i = 0;
                            q = 0;
                            ga = 37;
                          }
                        } else {
                          g = 0;
                          i = 0;
                          q = 0;
                          ga = 37;
                        }
                      } while (0);
                      if ((ga | 0) == 37) {
                        ga = 0;
                        d = g & 1;
                        e = (c + 16) | 0;
                        if (g | ((f[e >> 2] | 0) == 0)) {
                          m = i;
                          ga = 39;
                        } else {
                          g = 1;
                          m = i;
                          l = (c + 12) | 0;
                          j = (c + 8) | 0;
                          i = 1;
                        }
                      }
                      if ((ga | 0) == 39) {
                        ga = 0;
                        l = (c + 12) | 0;
                        A = +n[l >> 2];
                        na = A != q;
                        i = na & 1;
                        j = (c + 8) | 0;
                        g = (f[j >> 2] | 0) != (m | 0);
                        if (na) g = (q == 0) | (A == 0) | g;
                      }
                      f[(c + 24) >> 2] = i;
                      f[(c + 20) >> 2] = g & 1;
                      n[l >> 2] = q;
                      f[j >> 2] = m;
                      f[e >> 2] = d;
                      c = (c + 28) | 0;
                    } while (c >>> 0 < o >>> 0);
                  }
                } while (0);
                k = (k + 40) | 0;
                if (k >>> 0 >= u >>> 0) {
                  na = p;
                  break;
                }
              }
            } else ga = 15;
          } else ga = 15;
          if ((ga | 0) == 15) {
            w = (a + 376) | 0;
            na = w;
            w = f[w >> 2] | 0;
          }
          ca = (a + 316) | 0;
          c = f[ca >> 2] | 0;
          ba = f[(a + 312) >> 2] | 0;
          v = (c + ((ba * 36) | 0)) | 0;
          if ((ba | 0) > 0) {
            u = (a + 308) | 0;
            x = (w | 0) == 0;
            do {
              r = f[u >> 2] | 0;
              m = f[(c + 12) >> 2] | 0;
              k = f[c >> 2] | 0;
              s = (m + (k << 2)) | 0;
              b: do {
                if ((k | 0) > 0) {
                  i = 0;
                  j = m;
                  d = 0;
                  e = 0;
                  while (1) {
                    g = f[j >> 2] | 0;
                    if (f[(r + ((g * 28) | 0) + 16) >> 2] | 0) {
                      g = 0;
                      d = 0;
                      e = 1;
                      break b;
                    }
                    if (!i) i = f[(r + ((g * 28) | 0) + 24) >> 2] | 0;
                    if (!e) e = f[(r + ((g * 28) | 0) + 20) >> 2] | 0;
                    d = (((+n[(r + ((g * 28) | 0) + 12) >> 2] != 0) & 1) + d) | 0;
                    j = (j + 4) | 0;
                    if (j >>> 0 >= s >>> 0) {
                      j = d;
                      ga = 71;
                      break;
                    }
                  }
                } else {
                  i = 0;
                  j = 0;
                  e = 0;
                  ga = 71;
                }
              } while (0);
              c: do {
                if ((ga | 0) == 71) {
                  ga = 0;
                  d = x ? e : 1;
                  g = x ? i : 1;
                  if ((e | w | i | 0) != 0 ? ((y = 1 << j), (f[(c + 8) >> 2] = y), (z = f[(c + 16) >> 2] | 0), (B = f[(c + 20) >> 2] | 0), (C = (z + (y << 2)) | 0), (j | 0) != 31) : 0) {
                    i = (z + 4) | 0;
                    Hc(z | 0, 0, (((C >>> 0 > i >>> 0 ? C : i) + ~z + 4) & -4) | 0) | 0;
                    i = (B + (y << 2)) | 0;
                    e = B;
                    do {
                      n[e >> 2] = 1;
                      e = (e + 4) | 0;
                    } while (e >>> 0 < i >>> 0);
                    if ((k | 0) >= 1) {
                      if (!j) {
                        i = m;
                        j = 1;
                        while (1) {
                          k = f[i >> 2] | 0;
                          q = +n[(r + ((k * 28) | 0) + 12) >> 2];
                          l = U(f[(r + ((k * 28) | 0) + 8) >> 2] | 0, j) | 0;
                          if (q == 0) {
                            e = 0;
                            do {
                              ba = (z + (e << 2)) | 0;
                              f[ba >> 2] = (f[ba >> 2] | 0) + l;
                              e = (e + 1) | 0;
                            } while ((e | 0) != (y | 0));
                          } else {
                            f[z >> 2] = (f[z >> 2] | 0) + l;
                            n[B >> 2] = (1 - q) * +n[B >> 2];
                          }
                          i = (i + 4) | 0;
                          j = U(f[(r + ((k * 28) | 0)) >> 2] | 0, j) | 0;
                          if (i >>> 0 >= s >>> 0) {
                            e = 0;
                            break c;
                          }
                        }
                      }
                      o = 1;
                      e = 1;
                      do {
                        p = f[m >> 2] | 0;
                        k = (r + ((p * 28) | 0) + 12) | 0;
                        q = +n[k >> 2];
                        i = f[(r + ((p * 28) | 0) + 8) >> 2] | 0;
                        l = U(i, o) | 0;
                        if (q == 0) {
                          i = 0;
                          do {
                            ba = (z + (i << 2)) | 0;
                            f[ba >> 2] = (f[ba >> 2] | 0) + l;
                            i = (i + 1) | 0;
                          } while ((i | 0) != (y | 0));
                        } else {
                          j = U((i + 1) | 0, o) | 0;
                          f[z >> 2] = (f[z >> 2] | 0) + l;
                          n[B >> 2] = (1 - q) * +n[B >> 2];
                          i = 1;
                          do {
                            W = +n[k >> 2];
                            aa = ((i & e) | 0) != 0;
                            ba = (z + (i << 2)) | 0;
                            f[ba >> 2] = (aa ? j : l) + (f[ba >> 2] | 0);
                            ba = (B + (i << 2)) | 0;
                            n[ba >> 2] = (aa ? W : 1 - W) * +n[ba >> 2];
                            i = (i + 1) | 0;
                          } while ((i | 0) != (y | 0));
                          e = e << 1;
                        }
                        m = (m + 4) | 0;
                        o = U(f[(r + ((p * 28) | 0)) >> 2] | 0, o) | 0;
                      } while (m >>> 0 < s >>> 0);
                      e = 0;
                    } else e = 0;
                  } else e = 0;
                }
              } while (0);
              f[(c + 28) >> 2] = g;
              f[(c + 24) >> 2] = d;
              f[(c + 32) >> 2] = e;
              c = (c + 36) | 0;
            } while (c >>> 0 < v >>> 0);
          }
          aa = (a + 4) | 0;
          e = f[aa >> 2] | 0;
          ba = (a + 52) | 0;
          c = f[ba >> 2] | 0;
          d = (c + (e << 2)) | 0;
          i = (e | 0) > 0;
          if (i) {
            do {
              W = +n[c >> 2];
              n[c >> 2] = W < 0 ? 0 : W > 1 ? 1 : W;
              c = (c + 4) | 0;
            } while (c >>> 0 < d >>> 0);
            d = (a + 8) | 0;
            g = f[d >> 2] | 0;
            k = (g + (e << 3)) | 0;
            l = f[ca >> 2] | 0;
            c = (a + 36) | 0;
            m = f[c >> 2] | 0;
            if (i) {
              e = f[(a + 40) >> 2] | 0;
              i = m;
              while (1) {
                do {
                  if (!(f[(g + 4) >> 2] | 0)) j = 0;
                  else {
                    $ = f[g >> 2] | 0;
                    if (($ | 0) != -1 ? (f[(m + ($ << 2)) >> 2] | 0) == 0 : 0) {
                      j = 0;
                      break;
                    }
                    j = (f[(l + (((f[e >> 2] | 0) * 36) | 0) + 32) >> 2] | 0) == 0;
                  }
                } while (0);
                f[i >> 2] = j & 1;
                g = (g + 8) | 0;
                if (g >>> 0 >= k >>> 0) break;
                else {
                  e = (e + 4) | 0;
                  i = (i + 4) | 0;
                }
              }
              r = f[ca >> 2] | 0;
              s = f[aa >> 2] | 0;
              e = f[a >> 2] | 0;
              u = f[(e + 724) >> 2] | 0;
              if ((s | 0) > 0) {
                v = (a + 20) | 0;
                w = (a + 28) | 0;
                m = (e + 936) | 0;
                o = (a + 16) | 0;
                j = f[(a + 40) >> 2] | 0;
                k = 0;
                l = 0;
                while (1) {
                  p = f[j >> 2] | 0;
                  e = (r + ((p * 36) | 0) + 24) | 0;
                  if (!((f[e >> 2] | 0) == 0 ? !(f[(r + ((p * 36) | 0) + 28) >> 2] | 0) : 0)) ga = 108;
                  if (((ga | 0) == 108 ? ((ga = 0), (D = (r + ((p * 36) | 0) + 8) | 0), (f[((f[o >> 2] | 0) + (l << 2)) >> 2] = f[D >> 2]), f[e >> 2] | 0) : 0) ? ((E = f[(u + (l << 2)) >> 2] | 0), (F = f[(r + ((p * 36) | 0) + 16) >> 2] | 0), ($ = f[D >> 2] | 0), (H = (F + ($ << 2)) | 0), ($ | 0) > 0) : 0) {
                    i = f[m >> 2] | 0;
                    e = ((f[w >> 2] | 0) + (k << 2)) | 0;
                    g = F;
                    while (1) {
                      f[e >> 2] = f[(i + (((f[g >> 2] | 0) + E) << 2)) >> 2];
                      g = (g + 4) | 0;
                      if (g >>> 0 >= H >>> 0) break;
                      else e = (e + 4) | 0;
                    }
                  }
                  if (f[(r + ((p * 36) | 0) + 28) >> 2] | 0 ? ((I = f[(r + ((p * 36) | 0) + 20) >> 2] | 0), ($ = f[(r + ((p * 36) | 0) + 8) >> 2] | 0), (J = (I + ($ << 2)) | 0), ($ | 0) > 0) : 0) {
                    e = I;
                    g = ((f[v >> 2] | 0) + (k << 2)) | 0;
                    while (1) {
                      f[g >> 2] = f[e >> 2];
                      e = (e + 4) | 0;
                      if (e >>> 0 >= J >>> 0) break;
                      else g = (g + 4) | 0;
                    }
                  }
                  l = (l + 1) | 0;
                  if ((l | 0) == (s | 0)) {
                    $ = c;
                    X = a;
                    Y = d;
                    break;
                  } else {
                    j = (j + 4) | 0;
                    k = ((f[(r + ((p * 36) | 0) + 4) >> 2] | 0) + k) | 0;
                  }
                }
              } else {
                $ = c;
                X = a;
                Y = d;
              }
            } else ga = 103;
          } else {
            c = (a + 36) | 0;
            d = (a + 8) | 0;
            ga = 103;
          }
          if ((ga | 0) == 103) {
            $ = c;
            X = a;
            Y = d;
          }
          kb(a);
          _ = (a + 60) | 0;
          c = f[_ >> 2] | 0;
          S = f[(a + 56) >> 2] | 0;
          i = (c + (S << 5)) | 0;
          j = f[ca >> 2] | 0;
          k = f[$ >> 2] | 0;
          Z = (a + 168) | 0;
          l = f[Z >> 2] | 0;
          m = f[(a + 172) >> 2] | 0;
          o = f[(a + 176) >> 2] | 0;
          if ((S | 0) > 0) {
            e = f[(a + 180) >> 2] | 0;
            g = l;
            while (1) {
              do {
                if (!(f[(c + 28) >> 2] | 0)) d = 0;
                else {
                  S = f[c >> 2] | 0;
                  if ((S | 0) != -1 ? (f[(k + (S << 2)) >> 2] | 0) == 0 : 0) {
                    d = 0;
                    break;
                  }
                  S = f[(c + 4) >> 2] | 0;
                  if ((S | 0) != -1 ? (f[(l + (S << 2)) >> 2] | 0) == 0 : 0) {
                    d = 0;
                    break;
                  }
                  d = (f[(j + (((f[e >> 2] | 0) * 36) | 0) + 32) >> 2] | 0) == 0;
                }
              } while (0);
              d = d & 1;
              f[g >> 2] = d;
              switch (f[(c + 8) >> 2] | 0) {
                case 0: {
                  f[(m + (f[(c + 12) >> 2] << 2)) >> 2] = d;
                  break;
                }
                case 1: {
                  f[(o + (f[(c + 12) >> 2] << 2)) >> 2] = d;
                  break;
                }
                default:
                  wa(4, 4254, K);
              }
              c = (c + 32) | 0;
              if (c >>> 0 >= i >>> 0) break;
              else {
                e = (e + 4) | 0;
                g = (g + 4) | 0;
              }
            }
            j = f[ca >> 2] | 0;
          }
          c = f[X >> 2] | 0;
          p = f[(c + 784) >> 2] | 0;
          r = f[(a + 64) >> 2] | 0;
          s = f[(c + 988) >> 2] | 0;
          if ((r | 0) > 0) {
            u = (a + 88) | 0;
            v = (a + 100) | 0;
            w = (a + 96) | 0;
            x = (c + 944) | 0;
            l = (c + 940) | 0;
            m = (a + 84) | 0;
            g = 0;
            i = 0;
            k = f[(a + 184) >> 2] | 0;
            while (1) {
              o = f[k >> 2] | 0;
              c = (j + ((o * 36) | 0) + 24) | 0;
              if (!((f[c >> 2] | 0) == 0 ? !(f[(j + ((o * 36) | 0) + 28) >> 2] | 0) : 0)) ga = 135;
              if (((ga | 0) == 135 ? ((ga = 0), (L = (j + ((o * 36) | 0) + 8) | 0), (f[((f[m >> 2] | 0) + (i << 2)) >> 2] = f[L >> 2]), f[c >> 2] | 0) : 0) ? ((M = f[(p + (i << 2)) >> 2] | 0), (N = f[(j + ((o * 36) | 0) + 16) >> 2] | 0), (S = f[L >> 2] | 0), (O = (N + (S << 2)) | 0), (S | 0) > 0) : 0) {
                c = N;
                d = ((f[w >> 2] | 0) + (g << 2)) | 0;
                e = ((f[v >> 2] | 0) + (g << 2)) | 0;
                while (1) {
                  S = ((f[c >> 2] | 0) + M) | 0;
                  f[e >> 2] = s + (f[((f[x >> 2] | 0) + (S << 2)) >> 2] << 2);
                  f[d >> 2] = f[((f[l >> 2] | 0) + (S << 2)) >> 2];
                  c = (c + 4) | 0;
                  if (c >>> 0 >= O >>> 0) break;
                  else {
                    d = (d + 4) | 0;
                    e = (e + 4) | 0;
                  }
                }
              }
              if (f[(j + ((o * 36) | 0) + 28) >> 2] | 0 ? ((P = f[(j + ((o * 36) | 0) + 20) >> 2] | 0), (S = f[(j + ((o * 36) | 0) + 8) >> 2] | 0), (Q = (P + (S << 2)) | 0), (S | 0) > 0) : 0) {
                c = P;
                d = ((f[u >> 2] | 0) + (g << 2)) | 0;
                while (1) {
                  f[d >> 2] = f[c >> 2];
                  c = (c + 4) | 0;
                  if (c >>> 0 >= Q >>> 0) break;
                  else d = (d + 4) | 0;
                }
              }
              i = (i + 1) | 0;
              if ((i | 0) == (r | 0)) break;
              else {
                g = ((f[(j + ((o * 36) | 0) + 4) >> 2] | 0) + g) | 0;
                k = (k + 4) | 0;
              }
            }
            c = f[X >> 2] | 0;
            j = f[ca >> 2] | 0;
          }
          D = f[(c + 808) >> 2] | 0;
          E = f[(a + 72) >> 2] | 0;
          F = f[(a + 76) >> 2] | 0;
          if ((E | 0) > 0) {
            H = (a + 120) | 0;
            I = (a + 132) | 0;
            J = (a + 136) | 0;
            K = (a + 140) | 0;
            L = (a + 144) | 0;
            M = (a + 128) | 0;
            N = (c + 968) | 0;
            O = (c + 972) | 0;
            P = (c + 952) | 0;
            Q = (c + 956) | 0;
            R = (c + 960) | 0;
            S = (c + 964) | 0;
            z = (c + 948) | 0;
            B = (a + 116) | 0;
            w = f[(a + 188) >> 2] | 0;
            x = 0;
            y = 0;
            while (1) {
              C = f[w >> 2] | 0;
              c = (j + ((C * 36) | 0) + 24) | 0;
              if (!((f[c >> 2] | 0) == 0 ? !(f[(j + ((C * 36) | 0) + 28) >> 2] | 0) : 0)) ga = 149;
              if ((ga | 0) == 149 ? ((ga = 0), (da = (j + ((C * 36) | 0) + 8) | 0), (f[((f[B >> 2] | 0) + (y << 2)) >> 2] = f[da >> 2]), f[c >> 2] | 0) : 0) {
                l = f[(D + (y << 2)) >> 2] | 0;
                m = f[(j + ((C * 36) | 0) + 16) >> 2] | 0;
                v = f[da >> 2] | 0;
                o = (m + (v << 2)) | 0;
                if ((v | 0) > 0) {
                  p = f[P >> 2] | 0;
                  r = f[Q >> 2] | 0;
                  s = f[R >> 2] | 0;
                  u = f[S >> 2] | 0;
                  v = f[z >> 2] | 0;
                  c = ((f[M >> 2] | 0) + (x << 2)) | 0;
                  d = ((f[L >> 2] | 0) + (x << 2)) | 0;
                  e = ((f[K >> 2] | 0) + (x << 2)) | 0;
                  g = ((f[J >> 2] | 0) + (x << 2)) | 0;
                  i = ((f[I >> 2] | 0) + (x << 2)) | 0;
                  k = m;
                  while (1) {
                    ua = ((f[k >> 2] | 0) + l) | 0;
                    f[i >> 2] = f[(p + (ua << 2)) >> 2];
                    f[g >> 2] = f[(r + (ua << 2)) >> 2];
                    f[e >> 2] = f[(s + (ua << 2)) >> 2];
                    f[d >> 2] = f[(u + (ua << 2)) >> 2];
                    f[c >> 2] = f[(v + (ua << 2)) >> 2];
                    k = (k + 4) | 0;
                    if (k >>> 0 >= o >>> 0) break;
                    else {
                      c = (c + 4) | 0;
                      d = (d + 4) | 0;
                      e = (e + 4) | 0;
                      g = (g + 4) | 0;
                      i = (i + 4) | 0;
                    }
                  }
                }
                ua = ((f[m >> 2] | 0) + l) | 0;
                f[(F + (y << 5) + 24) >> 2] = f[((f[N >> 2] | 0) + (ua << 2)) >> 2];
                f[(F + (y << 5) + 28) >> 2] = f[((f[O >> 2] | 0) + (ua << 2)) >> 2];
              }
              if (f[(j + ((C * 36) | 0) + 28) >> 2] | 0 ? ((ea = f[(j + ((C * 36) | 0) + 20) >> 2] | 0), (ua = f[(j + ((C * 36) | 0) + 8) >> 2] | 0), (fa = (ea + (ua << 2)) | 0), (ua | 0) > 0) : 0) {
                c = ea;
                d = ((f[H >> 2] | 0) + (x << 2)) | 0;
                while (1) {
                  f[d >> 2] = f[c >> 2];
                  c = (c + 4) | 0;
                  if (c >>> 0 >= fa >>> 0) break;
                  else d = (d + 4) | 0;
                }
              }
              y = (y + 1) | 0;
              if ((y | 0) == (E | 0)) break;
              else {
                w = (w + 4) | 0;
                x = ((f[(j + ((C * 36) | 0) + 4) >> 2] | 0) + x) | 0;
              }
            }
          }
          lb(a);
          mb(a);
          C = (a + 204) | 0;
          c = f[C >> 2] | 0;
          D = (a + 200) | 0;
          ua = f[D >> 2] | 0;
          k = (c + (ua << 4)) | 0;
          B = f[ca >> 2] | 0;
          i = f[$ >> 2] | 0;
          j = f[Z >> 2] | 0;
          if ((ua | 0) > 0) {
            d = f[(a + 252) >> 2] | 0;
            e = f[(a + 248) >> 2] | 0;
            while (1) {
              do {
                if (!(f[(c + 8) >> 2] | 0)) g = 0;
                else {
                  ua = f[c >> 2] | 0;
                  if ((ua | 0) != -1 ? (f[(i + (ua << 2)) >> 2] | 0) == 0 : 0) {
                    g = 0;
                    break;
                  }
                  ua = f[(c + 4) >> 2] | 0;
                  if ((ua | 0) != -1 ? (f[(j + (ua << 2)) >> 2] | 0) == 0 : 0) {
                    g = 0;
                    break;
                  }
                  g = (f[(B + (((f[d >> 2] | 0) * 36) | 0) + 32) >> 2] | 0) == 0;
                }
              } while (0);
              f[e >> 2] = g & 1;
              c = (c + 16) | 0;
              if (c >>> 0 >= k >>> 0) break;
              else {
                d = (d + 4) | 0;
                e = (e + 4) | 0;
              }
            }
            z = f[D >> 2] | 0;
            c = f[X >> 2] | 0;
            p = f[(c + 844) >> 2] | 0;
            r = f[(c + 988) >> 2] | 0;
            if ((z | 0) > 0) {
              s = (a + 216) | 0;
              u = (a + 232) | 0;
              v = (a + 224) | 0;
              w = (a + 228) | 0;
              x = (c + 984) | 0;
              y = (c + 976) | 0;
              l = (c + 980) | 0;
              m = (a + 212) | 0;
              i = f[(a + 252) >> 2] | 0;
              j = 0;
              k = 0;
              while (1) {
                o = f[i >> 2] | 0;
                c = (B + ((o * 36) | 0) + 24) | 0;
                if (!((f[c >> 2] | 0) == 0 ? !(f[(B + ((o * 36) | 0) + 28) >> 2] | 0) : 0)) ga = 172;
                if (((ga | 0) == 172 ? ((ga = 0), (ha = (B + ((o * 36) | 0) + 8) | 0), (f[((f[m >> 2] | 0) + (k << 2)) >> 2] = f[ha >> 2]), f[c >> 2] | 0) : 0) ? ((ia = f[(p + (k << 2)) >> 2] | 0), (ja = f[(B + ((o * 36) | 0) + 16) >> 2] | 0), (ua = f[ha >> 2] | 0), (ka = (ja + (ua << 2)) | 0), (ua | 0) > 0) : 0) {
                  c = ((f[w >> 2] | 0) + (j << 2)) | 0;
                  d = ((f[v >> 2] | 0) + (j << 2)) | 0;
                  e = ((f[u >> 2] | 0) + (j << 2)) | 0;
                  g = ja;
                  while (1) {
                    ua = ((f[g >> 2] | 0) + ia) | 0;
                    f[e >> 2] = r + (f[((f[x >> 2] | 0) + (ua << 2)) >> 2] << 2);
                    f[d >> 2] = f[((f[y >> 2] | 0) + (ua << 2)) >> 2];
                    f[c >> 2] = f[((f[l >> 2] | 0) + (ua << 2)) >> 2];
                    g = (g + 4) | 0;
                    if (g >>> 0 >= ka >>> 0) break;
                    else {
                      c = (c + 4) | 0;
                      d = (d + 4) | 0;
                      e = (e + 4) | 0;
                    }
                  }
                }
                if (f[(B + ((o * 36) | 0) + 28) >> 2] | 0 ? ((la = f[(B + ((o * 36) | 0) + 20) >> 2] | 0), (ua = f[(B + ((o * 36) | 0) + 8) >> 2] | 0), (ma = (la + (ua << 2)) | 0), (ua | 0) > 0) : 0) {
                  c = la;
                  d = ((f[s >> 2] | 0) + (j << 2)) | 0;
                  while (1) {
                    f[d >> 2] = f[c >> 2];
                    c = (c + 4) | 0;
                    if (c >>> 0 >= ma >>> 0) break;
                    else d = (d + 4) | 0;
                  }
                }
                k = (k + 1) | 0;
                if ((k | 0) == (z | 0)) break;
                else {
                  i = (i + 4) | 0;
                  j = ((f[(B + ((o * 36) | 0) + 4) >> 2] | 0) + j) | 0;
                }
              }
            }
          }
          nb(a);
          sb(a);
          tb(a);
          c = f[Y >> 2] | 0;
          ua = f[aa >> 2] | 0;
          i = (c + (ua << 3)) | 0;
          j = (a + 48) | 0;
          o = f[j >> 2] | 0;
          if ((ua | 0) > 0) {
            d = f[ba >> 2] | 0;
            e = f[$ >> 2] | 0;
            g = o;
            while (1) {
              if (f[e >> 2] | 0 ? ((oa = +n[d >> 2]), (n[g >> 2] = oa), (ra = f[c >> 2] | 0), (ra | 0) != -1) : 0) n[g >> 2] = oa * +n[(o + (ra << 2)) >> 2];
              c = (c + 8) | 0;
              if (c >>> 0 >= i >>> 0) break;
              else {
                d = (d + 4) | 0;
                e = (e + 4) | 0;
                g = (g + 4) | 0;
              }
            }
          }
          g = (a + 56) | 0;
          i = f[g >> 2] | 0;
          if ((i | 0) > 0) {
            c = f[Z >> 2] | 0;
            d = f[_ >> 2] | 0;
            e = 0;
            while (1) {
              if (f[c >> 2] | 0) pa[f[(d + 16) >> 2] & 3](d, e, g);
              e = (e + 1) | 0;
              if ((e | 0) == (i | 0)) break;
              else {
                c = (c + 4) | 0;
                d = (d + 32) | 0;
              }
            }
            o = f[j >> 2] | 0;
          }
          c = f[C >> 2] | 0;
          ua = f[D >> 2] | 0;
          l = (c + (ua << 4)) | 0;
          m = f[(a + 192) >> 2] | 0;
          j = f[_ >> 2] | 0;
          if ((ua | 0) > 0) {
            k = (a + 248) | 0;
            e = f[k >> 2] | 0;
            g = f[(a + 276) >> 2] | 0;
            i = f[(a + 272) >> 2] | 0;
            while (1) {
              if (f[e >> 2] | 0) {
                d = f[c >> 2] | 0;
                if ((d | 0) != -1) n[g >> 2] = +n[(o + (d << 2)) >> 2] * +n[g >> 2];
                d = f[(c + 4) >> 2] | 0;
                if ((d | 0) != -1) {
                  n[g >> 2] = +n[(m + (d << 2)) >> 2] * +n[g >> 2];
                  ua = f[i >> 2] | 0;
                  qa[f[(j + (d << 5) + 20) >> 2] & 3](f[(j + (d << 5) + 24) >> 2] | 0, ua, ua, f[(c + 12) >> 2] | 0);
                }
              }
              c = (c + 16) | 0;
              if (c >>> 0 >= l >>> 0) break;
              else {
                e = (e + 4) | 0;
                g = (g + 4) | 0;
                i = (i + 4) | 0;
              }
            }
          } else k = (a + 248) | 0;
          ub(a);
          vb(a);
          y = f[(a + 320) >> 2] | 0;
          z = f[(a + 324) >> 2] | 0;
          o = (z + ((y * 28) | 0)) | 0;
          B = (a + 268) | 0;
          e = f[B >> 2] | 0;
          p = f[(a + 44) >> 2] | 0;
          i = f[$ >> 2] | 0;
          d = f[k >> 2] | 0;
          if ((y | 0) > 0) {
            g = z;
            do {
              j = f[(g + 4) >> 2] | 0;
              if ((j | 0) > 0) {
                l = f[(g + 12) >> 2] | 0;
                m = (g + 20) | 0;
                c = 0;
                do {
                  ua = f[(l + (c << 4) + 4) >> 2] | 0;
                  ra = (f[(l + (c << 4)) >> 2] | 0) == 1;
                  f[(l + (c << 4) + 12) >> 2] = f[((f[((ra ? i : d) + (ua << 2)) >> 2] | 0) == 0 ? m : ((ra ? p : e) + (ua << 2)) | 0) >> 2];
                  c = (c + 1) | 0;
                } while ((c | 0) != (j | 0));
              }
              g = (g + 28) | 0;
            } while (g >>> 0 < o >>> 0);
            s = f[(a + 264) >> 2] | 0;
            u = (a + 328) | 0;
            v = (a + 336) | 0;
            w = (a + 332) | 0;
            r = 0;
            do {
              x = (z + ((r * 28) | 0) + 24) | 0;
              if ((f[x >> 2] | 0) > 0) {
                g = f[u >> 2] | 0;
                c = 0;
                do {
                  f[(g + (c << 2)) >> 2] = -1;
                  c = (c + 1) | 0;
                  i = f[x >> 2] | 0;
                } while ((c | 0) < (i | 0));
                if ((i | 0) > 0) {
                  g = f[v >> 2] | 0;
                  c = 0;
                  do {
                    f[(g + (c << 2)) >> 2] = -1;
                    c = (c + 1) | 0;
                  } while ((c | 0) < (f[x >> 2] | 0));
                }
              }
              l = (z + ((r * 28) | 0) + 4) | 0;
              if ((f[l >> 2] | 0) > 0) {
                g = f[w >> 2] | 0;
                c = 0;
                do {
                  f[(g + (c << 2)) >> 2] = -1;
                  c = (c + 1) | 0;
                  i = f[l >> 2] | 0;
                } while ((c | 0) < (i | 0));
                if ((i | 0) > 0) {
                  j = (z + ((r * 28) | 0) + 20) | 0;
                  g = f[(z + ((r * 28) | 0) + 12) >> 2] | 0;
                  i = f[v >> 2] | 0;
                  c = 0;
                  do {
                    ma = ((f[(g + (c << 4) + 12) >> 2] | 0) - (f[j >> 2] | 0)) | 0;
                    ua = (i + (ma << 2)) | 0;
                    ra = f[ua >> 2] | 0;
                    la = (ra | 0) == -1;
                    f[((f[(la ? u : w) >> 2] | 0) + ((la ? ma : ra) << 2)) >> 2] = c;
                    f[ua >> 2] = c;
                    c = (c + 1) | 0;
                  } while ((c | 0) < (f[l >> 2] | 0));
                }
              }
              c = f[x >> 2] | 0;
              if ((c | 0) > 0) {
                o = f[u >> 2] | 0;
                p = (z + ((r * 28) | 0) + 12) | 0;
                m = 0;
                g = f[(z + ((r * 28) | 0) + 8) >> 2] | 0;
                do {
                  i = f[(o + (m << 2)) >> 2] | 0;
                  if ((i | 0) != -1) {
                    j = f[p >> 2] | 0;
                    l = f[w >> 2] | 0;
                    do {
                      if ((f[(j + (i << 4)) >> 2] | 0) == 1) {
                        c = f[(j + (i << 4) + 8) >> 2] | 0;
                        f[(z + ((c * 28) | 0) + 8) >> 2] = g;
                        c = f[(z + ((c * 28) | 0)) >> 2] | 0;
                      } else {
                        f[(s + (f[(j + (i << 4) + 4) >> 2] << 2)) >> 2] = g;
                        c = 1;
                      }
                      g = (c + g) | 0;
                      ua = i;
                      i = f[(l + (i << 2)) >> 2] | 0;
                    } while (!(((i | 0) <= (ua | 0)) | ((i | 0) == -1)));
                    c = f[x >> 2] | 0;
                  }
                  m = (m + 1) | 0;
                } while ((m | 0) < (c | 0));
              }
              r = (r + 1) | 0;
            } while ((r | 0) != (y | 0));
          }
          p = f[D >> 2] | 0;
          if (f[na >> 2] | 0) {
            f[sa >> 2] = 0;
            if ((p | 0) <= 0) {
              f[na >> 2] = 0;
              t = ta;
              return;
            }
            g = (a + 260) | 0;
            e = (a + 276) | 0;
            c = 0;
            while (1) {
              if ((f[(d + (c << 2)) >> 2] | 0) != 0 ? +n[((f[e >> 2] | 0) + (c << 2)) >> 2] != 0 : 0) d = 63;
              else d = 62;
              b[((f[g >> 2] | 0) + c) >> 0] = d;
              c = (c + 1) | 0;
              if ((c | 0) == (p | 0)) break;
              d = f[k >> 2] | 0;
            }
            f[na >> 2] = 0;
            t = ta;
            return;
          }
          if (f[sa >> 2] | 0) {
            f[sa >> 2] = 0;
            if ((p | 0) <= 0) {
              f[na >> 2] = 0;
              t = ta;
              return;
            }
            i = (a + 260) | 0;
            j = (a + 276) | 0;
            l = (a + 288) | 0;
            m = (a + 284) | 0;
            o = (a + 264) | 0;
            g = (a + 280) | 0;
            c = 0;
            while (1) {
              sa = (f[(d + (c << 2)) >> 2] | 0) == 0;
              oa = +n[((f[j >> 2] | 0) + (c << 2)) >> 2];
              a = (oa != 0) & (sa ^ 1) & 1;
              ua = ((f[i >> 2] | 0) + c) | 0;
              a = (b[ua >> 0] & 1) == (a << 24) >> 24 ? a : a | 2;
              a = oa != +n[((f[l >> 2] | 0) + (c << 2)) >> 2] ? a | 4 : a;
              a = (f[(e + (c << 2)) >> 2] | 0) == (f[((f[m >> 2] | 0) + (c << 2)) >> 2] | 0) ? a : a | 8;
              a = (f[((f[o >> 2] | 0) + (c << 2)) >> 2] | 0) == (f[((f[g >> 2] | 0) + (c << 2)) >> 2] | 0) ? a : a | 16;
              b[ua >> 0] = sa ? a : a | 32;
              c = (c + 1) | 0;
              if ((c | 0) == (p | 0)) break;
              d = f[k >> 2] | 0;
              e = f[B >> 2] | 0;
            }
            f[na >> 2] = 0;
            t = ta;
            return;
          }
          if ((p | 0) <= 0) {
            f[na >> 2] = 0;
            t = ta;
            return;
          }
          j = (a + 260) | 0;
          i = (a + 276) | 0;
          c = 0;
          while (1) {
            g = ((f[j >> 2] | 0) + c) | 0;
            e = h[g >> 0] | 0;
            if ((f[(d + (c << 2)) >> 2] | 0) != 0 ? +n[((f[i >> 2] | 0) + (c << 2)) >> 2] != 0 : 0) d = e | 1;
            else d = e & 254;
            b[g >> 0] = d;
            c = (c + 1) | 0;
            if ((c | 0) == (p | 0)) break;
            d = f[k >> 2] | 0;
          }
          f[na >> 2] = 0;
          t = ta;
          return;
        }
        function xb(a, b) {
          a = a | 0;
          b = b | 0;
          var c = 0,
            d = 0,
            e = 0;
          c = t;
          t = (t + 272) | 0;
          d = (c + 16) | 0;
          e = c;
          f[e >> 2] = b;
          Sb(d, 256, a, e) | 0;
          yb(d);
          t = c;
          return;
        }
        function yb(a) {
          a = a | 0;
          var b = 0,
            c = 0,
            d = 0;
          b = t;
          t = (t + 16) | 0;
          c = b;
          d = f[600] | 0;
          f[c >> 2] = a;
          vc(d, 4314, c) | 0;
          t = b;
          return;
        }
        function zb(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = t;
          t = (t + 16) | 0;
          b = c;
          Hb(b, 64, a) | 0;
          t = c;
          return f[b >> 2] | 0;
        }
        function Ab(a) {
          a = a | 0;
          var b = 0,
            c = 0,
            d = 0;
          d = t;
          t = (t + 16) | 0;
          c = d;
          if ((a | 0) != 0 ? ((b = Ea(a) | 0), (Hb(c, 16, b) | 0) == 0) : 0) {
            a = Fa(a, f[c >> 2] | 0, b) | 0;
            if (!a) {
              Eb(f[c >> 2] | 0);
              a = 0;
            }
          } else a = 0;
          t = d;
          return a | 0;
        }
        function Bb(a) {
          a = a | 0;
          return Db(a) | 0;
        }
        function Cb(a) {
          a = a | 0;
          Eb(a);
          return;
        }
        function Db(a) {
          a = a | 0;
          var b = 0,
            c = 0,
            d = 0,
            e = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0;
          x = t;
          t = (t + 16) | 0;
          n = x;
          do {
            if (a >>> 0 < 245) {
              k = a >>> 0 < 11 ? 16 : (a + 11) & -8;
              a = 3 ? k >>> 3 : k;
              m = f[1356] | 0;
              c = a ? m >>> a : m;
              if ((c & 3) | 0) {
                b = (((c & 1) ^ 1) + a) | 0;
                a = (5464 + ((b << 1) << 2)) | 0;
                c = (a + 8) | 0;
                d = f[c >> 2] | 0;
                e = (d + 8) | 0;
                g = f[e >> 2] | 0;
                if ((g | 0) == (a | 0)) f[1356] = m & ~(1 << b);
                else {
                  f[(g + 12) >> 2] = a;
                  f[c >> 2] = g;
                }
                w = b << 3;
                f[(d + 4) >> 2] = w | 3;
                w = (d + w + 4) | 0;
                f[w >> 2] = f[w >> 2] | 1;
                w = e;
                t = x;
                return w | 0;
              }
              l = f[1358] | 0;
              if (k >>> 0 > l >>> 0) {
                if (c | 0) {
                  d = 2 << a;
                  d = (c << a) & (d | (0 - d));
                  d = ((d & (0 - d)) + -1) | 0;
                  i = (12 ? d >>> 12 : d) & 16;
                  d = i ? d >>> i : d;
                  c = (5 ? d >>> 5 : d) & 8;
                  d = c ? d >>> c : d;
                  g = (2 ? d >>> 2 : d) & 4;
                  d = g ? d >>> g : d;
                  a = (1 ? d >>> 1 : d) & 2;
                  d = a ? d >>> a : d;
                  b = (1 ? d >>> 1 : d) & 1;
                  d = ((c | i | g | a | b) + (b ? d >>> b : d)) | 0;
                  b = (5464 + ((d << 1) << 2)) | 0;
                  a = (b + 8) | 0;
                  g = f[a >> 2] | 0;
                  i = (g + 8) | 0;
                  c = f[i >> 2] | 0;
                  if ((c | 0) == (b | 0)) {
                    a = m & ~(1 << d);
                    f[1356] = a;
                  } else {
                    f[(c + 12) >> 2] = b;
                    f[a >> 2] = c;
                    a = m;
                  }
                  w = d << 3;
                  h = (w - k) | 0;
                  f[(g + 4) >> 2] = k | 3;
                  e = (g + k) | 0;
                  f[(e + 4) >> 2] = h | 1;
                  f[(g + w) >> 2] = h;
                  if (l | 0) {
                    d = f[1361] | 0;
                    b = 3 ? l >>> 3 : l;
                    c = (5464 + ((b << 1) << 2)) | 0;
                    b = 1 << b;
                    if (!(a & b)) {
                      f[1356] = a | b;
                      b = c;
                      a = (c + 8) | 0;
                    } else {
                      a = (c + 8) | 0;
                      b = f[a >> 2] | 0;
                    }
                    f[a >> 2] = d;
                    f[(b + 12) >> 2] = d;
                    f[(d + 8) >> 2] = b;
                    f[(d + 12) >> 2] = c;
                  }
                  f[1358] = h;
                  f[1361] = e;
                  w = i;
                  t = x;
                  return w | 0;
                }
                g = f[1357] | 0;
                if (g) {
                  j = ((g & (0 - g)) + -1) | 0;
                  e = (12 ? j >>> 12 : j) & 16;
                  j = e ? j >>> e : j;
                  d = (5 ? j >>> 5 : j) & 8;
                  j = d ? j >>> d : j;
                  h = (2 ? j >>> 2 : j) & 4;
                  j = h ? j >>> h : j;
                  i = (1 ? j >>> 1 : j) & 2;
                  j = i ? j >>> i : j;
                  c = (1 ? j >>> 1 : j) & 1;
                  j = f[(5728 + (((d | e | h | i | c) + (c ? j >>> c : j)) << 2)) >> 2] | 0;
                  c = j;
                  i = j;
                  j = ((f[(j + 4) >> 2] & -8) - k) | 0;
                  while (1) {
                    a = f[(c + 16) >> 2] | 0;
                    if (!a) {
                      a = f[(c + 20) >> 2] | 0;
                      if (!a) break;
                    }
                    h = ((f[(a + 4) >> 2] & -8) - k) | 0;
                    e = h >>> 0 < j >>> 0;
                    c = a;
                    i = e ? a : i;
                    j = e ? h : j;
                  }
                  h = (i + k) | 0;
                  if (h >>> 0 > i >>> 0) {
                    e = f[(i + 24) >> 2] | 0;
                    b = f[(i + 12) >> 2] | 0;
                    do {
                      if ((b | 0) == (i | 0)) {
                        a = (i + 20) | 0;
                        b = f[a >> 2] | 0;
                        if (!b) {
                          a = (i + 16) | 0;
                          b = f[a >> 2] | 0;
                          if (!b) {
                            c = 0;
                            break;
                          }
                        }
                        while (1) {
                          d = (b + 20) | 0;
                          c = f[d >> 2] | 0;
                          if (!c) {
                            d = (b + 16) | 0;
                            c = f[d >> 2] | 0;
                            if (!c) break;
                            else {
                              b = c;
                              a = d;
                            }
                          } else {
                            b = c;
                            a = d;
                          }
                        }
                        f[a >> 2] = 0;
                        c = b;
                      } else {
                        c = f[(i + 8) >> 2] | 0;
                        f[(c + 12) >> 2] = b;
                        f[(b + 8) >> 2] = c;
                        c = b;
                      }
                    } while (0);
                    do {
                      if (e | 0) {
                        b = f[(i + 28) >> 2] | 0;
                        a = (5728 + (b << 2)) | 0;
                        if ((i | 0) == (f[a >> 2] | 0)) {
                          f[a >> 2] = c;
                          if (!c) {
                            f[1357] = g & ~(1 << b);
                            break;
                          }
                        } else {
                          w = (e + 16) | 0;
                          f[((f[w >> 2] | 0) == (i | 0) ? w : (e + 20) | 0) >> 2] = c;
                          if (!c) break;
                        }
                        f[(c + 24) >> 2] = e;
                        b = f[(i + 16) >> 2] | 0;
                        if (b | 0) {
                          f[(c + 16) >> 2] = b;
                          f[(b + 24) >> 2] = c;
                        }
                        b = f[(i + 20) >> 2] | 0;
                        if (b | 0) {
                          f[(c + 20) >> 2] = b;
                          f[(b + 24) >> 2] = c;
                        }
                      }
                    } while (0);
                    if (j >>> 0 < 16) {
                      w = (j + k) | 0;
                      f[(i + 4) >> 2] = w | 3;
                      w = (i + w + 4) | 0;
                      f[w >> 2] = f[w >> 2] | 1;
                    } else {
                      f[(i + 4) >> 2] = k | 3;
                      f[(h + 4) >> 2] = j | 1;
                      f[(h + j) >> 2] = j;
                      if (l | 0) {
                        d = f[1361] | 0;
                        b = 3 ? l >>> 3 : l;
                        c = (5464 + ((b << 1) << 2)) | 0;
                        b = 1 << b;
                        if (!(b & m)) {
                          f[1356] = b | m;
                          b = c;
                          a = (c + 8) | 0;
                        } else {
                          a = (c + 8) | 0;
                          b = f[a >> 2] | 0;
                        }
                        f[a >> 2] = d;
                        f[(b + 12) >> 2] = d;
                        f[(d + 8) >> 2] = b;
                        f[(d + 12) >> 2] = c;
                      }
                      f[1358] = j;
                      f[1361] = h;
                    }
                    w = (i + 8) | 0;
                    t = x;
                    return w | 0;
                  } else m = k;
                } else m = k;
              } else m = k;
            } else if (a >>> 0 <= 4294967231) {
              a = (a + 11) | 0;
              k = a & -8;
              d = f[1357] | 0;
              if (d) {
                e = (0 - k) | 0;
                a = 8 ? a >>> 8 : a;
                if (a)
                  if (k >>> 0 > 16777215) j = 31;
                  else {
                    m = (a + 1048320) | 0;
                    m = (16 ? m >>> 16 : m) & 8;
                    j = a << m;
                    i = (j + 520192) | 0;
                    i = (16 ? i >>> 16 : i) & 4;
                    j = j << i;
                    q = (j + 245760) | 0;
                    q = (16 ? q >>> 16 : q) & 2;
                    j = j << q;
                    j = (14 - (i | m | q) + (15 ? j >>> 15 : j)) | 0;
                    q = (j + 7) | 0;
                    j = ((q ? k >>> q : k) & 1) | (j << 1);
                  }
                else j = 0;
                c = f[(5728 + (j << 2)) >> 2] | 0;
                a: do {
                  if (!c) {
                    c = 0;
                    a = 0;
                    q = 61;
                  } else {
                    a = 0;
                    i = k << ((j | 0) == 31 ? 0 : (25 - (1 ? j >>> 1 : j)) | 0);
                    g = 0;
                    while (1) {
                      h = ((f[(c + 4) >> 2] & -8) - k) | 0;
                      if (h >>> 0 < e >>> 0)
                        if (!h) {
                          a = c;
                          e = 0;
                          q = 65;
                          break a;
                        } else {
                          a = c;
                          e = h;
                        }
                      q = f[(c + 20) >> 2] | 0;
                      c = f[(c + 16 + ((31 ? i >>> 31 : i) << 2)) >> 2] | 0;
                      g = ((q | 0) == 0) | ((q | 0) == (c | 0)) ? g : q;
                      if (!c) {
                        c = g;
                        q = 61;
                        break;
                      } else i = i << 1;
                    }
                  }
                } while (0);
                if ((q | 0) == 61) {
                  if (((c | 0) == 0) & ((a | 0) == 0)) {
                    a = 2 << j;
                    a = (a | (0 - a)) & d;
                    if (!a) {
                      m = k;
                      break;
                    }
                    c = ((a & (0 - a)) + -1) | 0;
                    h = (12 ? c >>> 12 : c) & 16;
                    c = h ? c >>> h : c;
                    g = (5 ? c >>> 5 : c) & 8;
                    c = g ? c >>> g : c;
                    i = (2 ? c >>> 2 : c) & 4;
                    c = i ? c >>> i : c;
                    j = (1 ? c >>> 1 : c) & 2;
                    c = j ? c >>> j : c;
                    m = (1 ? c >>> 1 : c) & 1;
                    a = 0;
                    c = f[(5728 + (((g | h | i | j | m) + (m ? c >>> m : c)) << 2)) >> 2] | 0;
                  }
                  if (!c) {
                    i = a;
                    h = e;
                  } else q = 65;
                }
                if ((q | 0) == 65) {
                  g = c;
                  while (1) {
                    m = ((f[(g + 4) >> 2] & -8) - k) | 0;
                    c = m >>> 0 < e >>> 0;
                    e = c ? m : e;
                    a = c ? g : a;
                    c = f[(g + 16) >> 2] | 0;
                    if (!c) c = f[(g + 20) >> 2] | 0;
                    if (!c) {
                      i = a;
                      h = e;
                      break;
                    } else g = c;
                  }
                }
                if (((i | 0) != 0 ? h >>> 0 < (((f[1358] | 0) - k) | 0) >>> 0 : 0) ? ((l = (i + k) | 0), l >>> 0 > i >>> 0) : 0) {
                  g = f[(i + 24) >> 2] | 0;
                  b = f[(i + 12) >> 2] | 0;
                  do {
                    if ((b | 0) == (i | 0)) {
                      a = (i + 20) | 0;
                      b = f[a >> 2] | 0;
                      if (!b) {
                        a = (i + 16) | 0;
                        b = f[a >> 2] | 0;
                        if (!b) {
                          b = 0;
                          break;
                        }
                      }
                      while (1) {
                        e = (b + 20) | 0;
                        c = f[e >> 2] | 0;
                        if (!c) {
                          e = (b + 16) | 0;
                          c = f[e >> 2] | 0;
                          if (!c) break;
                          else {
                            b = c;
                            a = e;
                          }
                        } else {
                          b = c;
                          a = e;
                        }
                      }
                      f[a >> 2] = 0;
                    } else {
                      w = f[(i + 8) >> 2] | 0;
                      f[(w + 12) >> 2] = b;
                      f[(b + 8) >> 2] = w;
                    }
                  } while (0);
                  do {
                    if (g) {
                      a = f[(i + 28) >> 2] | 0;
                      c = (5728 + (a << 2)) | 0;
                      if ((i | 0) == (f[c >> 2] | 0)) {
                        f[c >> 2] = b;
                        if (!b) {
                          d = d & ~(1 << a);
                          f[1357] = d;
                          break;
                        }
                      } else {
                        w = (g + 16) | 0;
                        f[((f[w >> 2] | 0) == (i | 0) ? w : (g + 20) | 0) >> 2] = b;
                        if (!b) break;
                      }
                      f[(b + 24) >> 2] = g;
                      a = f[(i + 16) >> 2] | 0;
                      if (a | 0) {
                        f[(b + 16) >> 2] = a;
                        f[(a + 24) >> 2] = b;
                      }
                      a = f[(i + 20) >> 2] | 0;
                      if (a) {
                        f[(b + 20) >> 2] = a;
                        f[(a + 24) >> 2] = b;
                      }
                    }
                  } while (0);
                  b: do {
                    if (h >>> 0 < 16) {
                      w = (h + k) | 0;
                      f[(i + 4) >> 2] = w | 3;
                      w = (i + w + 4) | 0;
                      f[w >> 2] = f[w >> 2] | 1;
                    } else {
                      f[(i + 4) >> 2] = k | 3;
                      f[(l + 4) >> 2] = h | 1;
                      f[(l + h) >> 2] = h;
                      b = 3 ? h >>> 3 : h;
                      if (h >>> 0 < 256) {
                        c = (5464 + ((b << 1) << 2)) | 0;
                        a = f[1356] | 0;
                        b = 1 << b;
                        if (!(a & b)) {
                          f[1356] = a | b;
                          b = c;
                          a = (c + 8) | 0;
                        } else {
                          a = (c + 8) | 0;
                          b = f[a >> 2] | 0;
                        }
                        f[a >> 2] = l;
                        f[(b + 12) >> 2] = l;
                        f[(l + 8) >> 2] = b;
                        f[(l + 12) >> 2] = c;
                        break;
                      }
                      b = 8 ? h >>> 8 : h;
                      if (b)
                        if (h >>> 0 > 16777215) c = 31;
                        else {
                          v = (b + 1048320) | 0;
                          v = (16 ? v >>> 16 : v) & 8;
                          c = b << v;
                          u = (c + 520192) | 0;
                          u = (16 ? u >>> 16 : u) & 4;
                          c = c << u;
                          w = (c + 245760) | 0;
                          w = (16 ? w >>> 16 : w) & 2;
                          c = c << w;
                          c = (14 - (u | v | w) + (15 ? c >>> 15 : c)) | 0;
                          w = (c + 7) | 0;
                          c = ((w ? h >>> w : h) & 1) | (c << 1);
                        }
                      else c = 0;
                      b = (5728 + (c << 2)) | 0;
                      f[(l + 28) >> 2] = c;
                      a = (l + 16) | 0;
                      f[(a + 4) >> 2] = 0;
                      f[a >> 2] = 0;
                      a = 1 << c;
                      if (!(d & a)) {
                        f[1357] = d | a;
                        f[b >> 2] = l;
                        f[(l + 24) >> 2] = b;
                        f[(l + 12) >> 2] = l;
                        f[(l + 8) >> 2] = l;
                        break;
                      }
                      b = f[b >> 2] | 0;
                      c: do {
                        if (((f[(b + 4) >> 2] & -8) | 0) != (h | 0)) {
                          d = h << ((c | 0) == 31 ? 0 : (25 - (1 ? c >>> 1 : c)) | 0);
                          while (1) {
                            c = (b + 16 + ((31 ? d >>> 31 : d) << 2)) | 0;
                            a = f[c >> 2] | 0;
                            if (!a) break;
                            if (((f[(a + 4) >> 2] & -8) | 0) == (h | 0)) {
                              b = a;
                              break c;
                            } else {
                              d = d << 1;
                              b = a;
                            }
                          }
                          f[c >> 2] = l;
                          f[(l + 24) >> 2] = b;
                          f[(l + 12) >> 2] = l;
                          f[(l + 8) >> 2] = l;
                          break b;
                        }
                      } while (0);
                      v = (b + 8) | 0;
                      w = f[v >> 2] | 0;
                      f[(w + 12) >> 2] = l;
                      f[v >> 2] = l;
                      f[(l + 8) >> 2] = w;
                      f[(l + 12) >> 2] = b;
                      f[(l + 24) >> 2] = 0;
                    }
                  } while (0);
                  w = (i + 8) | 0;
                  t = x;
                  return w | 0;
                } else m = k;
              } else m = k;
            } else m = -1;
          } while (0);
          c = f[1358] | 0;
          if (c >>> 0 >= m >>> 0) {
            b = (c - m) | 0;
            a = f[1361] | 0;
            if (b >>> 0 > 15) {
              w = (a + m) | 0;
              f[1361] = w;
              f[1358] = b;
              f[(w + 4) >> 2] = b | 1;
              f[(a + c) >> 2] = b;
              f[(a + 4) >> 2] = m | 3;
            } else {
              f[1358] = 0;
              f[1361] = 0;
              f[(a + 4) >> 2] = c | 3;
              w = (a + c + 4) | 0;
              f[w >> 2] = f[w >> 2] | 1;
            }
            w = (a + 8) | 0;
            t = x;
            return w | 0;
          }
          h = f[1359] | 0;
          if (h >>> 0 > m >>> 0) {
            u = (h - m) | 0;
            f[1359] = u;
            w = f[1362] | 0;
            v = (w + m) | 0;
            f[1362] = v;
            f[(v + 4) >> 2] = u | 1;
            f[(w + 4) >> 2] = m | 3;
            w = (w + 8) | 0;
            t = x;
            return w | 0;
          }
          if (!(f[1474] | 0)) {
            f[1476] = 4096;
            f[1475] = 4096;
            f[1477] = -1;
            f[1478] = -1;
            f[1479] = 0;
            f[1467] = 0;
            f[1474] = (n & -16) ^ 1431655768;
            a = 4096;
          } else a = f[1476] | 0;
          i = (m + 48) | 0;
          j = (m + 47) | 0;
          g = (a + j) | 0;
          e = (0 - a) | 0;
          k = g & e;
          if (k >>> 0 <= m >>> 0) {
            w = 0;
            t = x;
            return w | 0;
          }
          a = f[1466] | 0;
          if (a | 0 ? ((l = f[1464] | 0), (n = (l + k) | 0), (n >>> 0 <= l >>> 0) | (n >>> 0 > a >>> 0)) : 0) {
            w = 0;
            t = x;
            return w | 0;
          }
          d: do {
            if (!(f[1467] & 4)) {
              c = f[1362] | 0;
              e: do {
                if (c) {
                  d = 5872;
                  while (1) {
                    n = f[d >> 2] | 0;
                    if (n >>> 0 <= c >>> 0 ? ((n + (f[(d + 4) >> 2] | 0)) | 0) >>> 0 > c >>> 0 : 0) break;
                    a = f[(d + 8) >> 2] | 0;
                    if (!a) {
                      q = 128;
                      break e;
                    } else d = a;
                  }
                  b = (g - h) & e;
                  if (b >>> 0 < 2147483647) {
                    a = Ic(b | 0) | 0;
                    if ((a | 0) == (((f[d >> 2] | 0) + (f[(d + 4) >> 2] | 0)) | 0)) {
                      if ((a | 0) != (-1 | 0)) {
                        h = b;
                        g = a;
                        q = 145;
                        break d;
                      }
                    } else {
                      d = a;
                      q = 136;
                    }
                  } else b = 0;
                } else q = 128;
              } while (0);
              do {
                if ((q | 0) == 128) {
                  c = Ic(0) | 0;
                  if ((c | 0) != (-1 | 0) ? ((b = c), (o = f[1475] | 0), (p = (o + -1) | 0), (b = ((((p & b) | 0) == 0 ? 0 : (((p + b) & (0 - o)) - b) | 0) + k) | 0), (o = f[1464] | 0), (p = (b + o) | 0), (b >>> 0 > m >>> 0) & (b >>> 0 < 2147483647)) : 0) {
                    n = f[1466] | 0;
                    if (n | 0 ? (p >>> 0 <= o >>> 0) | (p >>> 0 > n >>> 0) : 0) {
                      b = 0;
                      break;
                    }
                    a = Ic(b | 0) | 0;
                    if ((a | 0) == (c | 0)) {
                      h = b;
                      g = c;
                      q = 145;
                      break d;
                    } else {
                      d = a;
                      q = 136;
                    }
                  } else b = 0;
                }
              } while (0);
              do {
                if ((q | 0) == 136) {
                  c = (0 - b) | 0;
                  if (!((i >>> 0 > b >>> 0) & ((b >>> 0 < 2147483647) & ((d | 0) != (-1 | 0)))))
                    if ((d | 0) == (-1 | 0)) {
                      b = 0;
                      break;
                    } else {
                      h = b;
                      g = d;
                      q = 145;
                      break d;
                    }
                  a = f[1476] | 0;
                  a = (j - b + a) & (0 - a);
                  if (a >>> 0 >= 2147483647) {
                    h = b;
                    g = d;
                    q = 145;
                    break d;
                  }
                  if ((Ic(a | 0) | 0) == (-1 | 0)) {
                    Ic(c | 0) | 0;
                    b = 0;
                    break;
                  } else {
                    h = (a + b) | 0;
                    g = d;
                    q = 145;
                    break d;
                  }
                }
              } while (0);
              f[1467] = f[1467] | 4;
              q = 143;
            } else {
              b = 0;
              q = 143;
            }
          } while (0);
          if (((q | 0) == 143 ? k >>> 0 < 2147483647 : 0) ? ((u = Ic(k | 0) | 0), (p = Ic(0) | 0), (r = (p - u) | 0), (s = r >>> 0 > ((m + 40) | 0) >>> 0), !(((u | 0) == (-1 | 0)) | (s ^ 1) | (((u >>> 0 < p >>> 0) & (((u | 0) != (-1 | 0)) & ((p | 0) != (-1 | 0)))) ^ 1))) : 0) {
            h = s ? r : b;
            g = u;
            q = 145;
          }
          if ((q | 0) == 145) {
            b = ((f[1464] | 0) + h) | 0;
            f[1464] = b;
            if (b >>> 0 > (f[1465] | 0) >>> 0) f[1465] = b;
            j = f[1362] | 0;
            f: do {
              if (j) {
                b = 5872;
                while (1) {
                  a = f[b >> 2] | 0;
                  c = f[(b + 4) >> 2] | 0;
                  if ((g | 0) == ((a + c) | 0)) {
                    q = 154;
                    break;
                  }
                  d = f[(b + 8) >> 2] | 0;
                  if (!d) break;
                  else b = d;
                }
                if (((q | 0) == 154 ? ((v = (b + 4) | 0), ((f[(b + 12) >> 2] & 8) | 0) == 0) : 0) ? (g >>> 0 > j >>> 0) & (a >>> 0 <= j >>> 0) : 0) {
                  f[v >> 2] = c + h;
                  w = ((f[1359] | 0) + h) | 0;
                  u = (j + 8) | 0;
                  u = ((u & 7) | 0) == 0 ? 0 : (0 - u) & 7;
                  v = (j + u) | 0;
                  u = (w - u) | 0;
                  f[1362] = v;
                  f[1359] = u;
                  f[(v + 4) >> 2] = u | 1;
                  f[(j + w + 4) >> 2] = 40;
                  f[1363] = f[1478];
                  break;
                }
                if (g >>> 0 < (f[1360] | 0) >>> 0) f[1360] = g;
                c = (g + h) | 0;
                b = 5872;
                while (1) {
                  if ((f[b >> 2] | 0) == (c | 0)) {
                    q = 162;
                    break;
                  }
                  a = f[(b + 8) >> 2] | 0;
                  if (!a) break;
                  else b = a;
                }
                if ((q | 0) == 162 ? ((f[(b + 12) >> 2] & 8) | 0) == 0 : 0) {
                  f[b >> 2] = g;
                  l = (b + 4) | 0;
                  f[l >> 2] = (f[l >> 2] | 0) + h;
                  l = (g + 8) | 0;
                  l = (g + (((l & 7) | 0) == 0 ? 0 : (0 - l) & 7)) | 0;
                  b = (c + 8) | 0;
                  b = (c + (((b & 7) | 0) == 0 ? 0 : (0 - b) & 7)) | 0;
                  k = (l + m) | 0;
                  i = (b - l - m) | 0;
                  f[(l + 4) >> 2] = m | 3;
                  g: do {
                    if ((j | 0) == (b | 0)) {
                      w = ((f[1359] | 0) + i) | 0;
                      f[1359] = w;
                      f[1362] = k;
                      f[(k + 4) >> 2] = w | 1;
                    } else {
                      if ((f[1361] | 0) == (b | 0)) {
                        w = ((f[1358] | 0) + i) | 0;
                        f[1358] = w;
                        f[1361] = k;
                        f[(k + 4) >> 2] = w | 1;
                        f[(k + w) >> 2] = w;
                        break;
                      }
                      a = f[(b + 4) >> 2] | 0;
                      if (((a & 3) | 0) == 1) {
                        h = a & -8;
                        d = 3 ? a >>> 3 : a;
                        h: do {
                          if (a >>> 0 < 256) {
                            a = f[(b + 8) >> 2] | 0;
                            c = f[(b + 12) >> 2] | 0;
                            if ((c | 0) == (a | 0)) {
                              f[1356] = f[1356] & ~(1 << d);
                              break;
                            } else {
                              f[(a + 12) >> 2] = c;
                              f[(c + 8) >> 2] = a;
                              break;
                            }
                          } else {
                            g = f[(b + 24) >> 2] | 0;
                            a = f[(b + 12) >> 2] | 0;
                            do {
                              if ((a | 0) == (b | 0)) {
                                c = (b + 16) | 0;
                                d = (c + 4) | 0;
                                a = f[d >> 2] | 0;
                                if (!a) {
                                  a = f[c >> 2] | 0;
                                  if (!a) {
                                    a = 0;
                                    break;
                                  }
                                } else c = d;
                                while (1) {
                                  e = (a + 20) | 0;
                                  d = f[e >> 2] | 0;
                                  if (!d) {
                                    e = (a + 16) | 0;
                                    d = f[e >> 2] | 0;
                                    if (!d) break;
                                    else {
                                      a = d;
                                      c = e;
                                    }
                                  } else {
                                    a = d;
                                    c = e;
                                  }
                                }
                                f[c >> 2] = 0;
                              } else {
                                w = f[(b + 8) >> 2] | 0;
                                f[(w + 12) >> 2] = a;
                                f[(a + 8) >> 2] = w;
                              }
                            } while (0);
                            if (!g) break;
                            c = f[(b + 28) >> 2] | 0;
                            d = (5728 + (c << 2)) | 0;
                            do {
                              if ((f[d >> 2] | 0) != (b | 0)) {
                                w = (g + 16) | 0;
                                f[((f[w >> 2] | 0) == (b | 0) ? w : (g + 20) | 0) >> 2] = a;
                                if (!a) break h;
                              } else {
                                f[d >> 2] = a;
                                if (a | 0) break;
                                f[1357] = f[1357] & ~(1 << c);
                                break h;
                              }
                            } while (0);
                            f[(a + 24) >> 2] = g;
                            c = (b + 16) | 0;
                            d = f[c >> 2] | 0;
                            if (d | 0) {
                              f[(a + 16) >> 2] = d;
                              f[(d + 24) >> 2] = a;
                            }
                            c = f[(c + 4) >> 2] | 0;
                            if (!c) break;
                            f[(a + 20) >> 2] = c;
                            f[(c + 24) >> 2] = a;
                          }
                        } while (0);
                        b = (b + h) | 0;
                        e = (h + i) | 0;
                      } else e = i;
                      b = (b + 4) | 0;
                      f[b >> 2] = f[b >> 2] & -2;
                      f[(k + 4) >> 2] = e | 1;
                      f[(k + e) >> 2] = e;
                      b = 3 ? e >>> 3 : e;
                      if (e >>> 0 < 256) {
                        c = (5464 + ((b << 1) << 2)) | 0;
                        a = f[1356] | 0;
                        b = 1 << b;
                        if (!(a & b)) {
                          f[1356] = a | b;
                          b = c;
                          a = (c + 8) | 0;
                        } else {
                          a = (c + 8) | 0;
                          b = f[a >> 2] | 0;
                        }
                        f[a >> 2] = k;
                        f[(b + 12) >> 2] = k;
                        f[(k + 8) >> 2] = b;
                        f[(k + 12) >> 2] = c;
                        break;
                      }
                      b = 8 ? e >>> 8 : e;
                      do {
                        if (!b) d = 0;
                        else {
                          if (e >>> 0 > 16777215) {
                            d = 31;
                            break;
                          }
                          v = (b + 1048320) | 0;
                          v = (16 ? v >>> 16 : v) & 8;
                          d = b << v;
                          u = (d + 520192) | 0;
                          u = (16 ? u >>> 16 : u) & 4;
                          d = d << u;
                          w = (d + 245760) | 0;
                          w = (16 ? w >>> 16 : w) & 2;
                          d = d << w;
                          d = (14 - (u | v | w) + (15 ? d >>> 15 : d)) | 0;
                          w = (d + 7) | 0;
                          d = ((w ? e >>> w : e) & 1) | (d << 1);
                        }
                      } while (0);
                      b = (5728 + (d << 2)) | 0;
                      f[(k + 28) >> 2] = d;
                      a = (k + 16) | 0;
                      f[(a + 4) >> 2] = 0;
                      f[a >> 2] = 0;
                      a = f[1357] | 0;
                      c = 1 << d;
                      if (!(a & c)) {
                        f[1357] = a | c;
                        f[b >> 2] = k;
                        f[(k + 24) >> 2] = b;
                        f[(k + 12) >> 2] = k;
                        f[(k + 8) >> 2] = k;
                        break;
                      }
                      b = f[b >> 2] | 0;
                      i: do {
                        if (((f[(b + 4) >> 2] & -8) | 0) != (e | 0)) {
                          d = e << ((d | 0) == 31 ? 0 : (25 - (1 ? d >>> 1 : d)) | 0);
                          while (1) {
                            c = (b + 16 + ((31 ? d >>> 31 : d) << 2)) | 0;
                            a = f[c >> 2] | 0;
                            if (!a) break;
                            if (((f[(a + 4) >> 2] & -8) | 0) == (e | 0)) {
                              b = a;
                              break i;
                            } else {
                              d = d << 1;
                              b = a;
                            }
                          }
                          f[c >> 2] = k;
                          f[(k + 24) >> 2] = b;
                          f[(k + 12) >> 2] = k;
                          f[(k + 8) >> 2] = k;
                          break g;
                        }
                      } while (0);
                      v = (b + 8) | 0;
                      w = f[v >> 2] | 0;
                      f[(w + 12) >> 2] = k;
                      f[v >> 2] = k;
                      f[(k + 8) >> 2] = w;
                      f[(k + 12) >> 2] = b;
                      f[(k + 24) >> 2] = 0;
                    }
                  } while (0);
                  w = (l + 8) | 0;
                  t = x;
                  return w | 0;
                }
                b = 5872;
                while (1) {
                  a = f[b >> 2] | 0;
                  if (a >>> 0 <= j >>> 0 ? ((w = (a + (f[(b + 4) >> 2] | 0)) | 0), w >>> 0 > j >>> 0) : 0) break;
                  b = f[(b + 8) >> 2] | 0;
                }
                e = (w + -47) | 0;
                a = (e + 8) | 0;
                a = (e + (((a & 7) | 0) == 0 ? 0 : (0 - a) & 7)) | 0;
                e = (j + 16) | 0;
                a = a >>> 0 < e >>> 0 ? j : a;
                b = (a + 8) | 0;
                c = (h + -40) | 0;
                u = (g + 8) | 0;
                u = ((u & 7) | 0) == 0 ? 0 : (0 - u) & 7;
                v = (g + u) | 0;
                u = (c - u) | 0;
                f[1362] = v;
                f[1359] = u;
                f[(v + 4) >> 2] = u | 1;
                f[(g + c + 4) >> 2] = 40;
                f[1363] = f[1478];
                c = (a + 4) | 0;
                f[c >> 2] = 27;
                f[b >> 2] = f[1468];
                f[(b + 4) >> 2] = f[1469];
                f[(b + 8) >> 2] = f[1470];
                f[(b + 12) >> 2] = f[1471];
                f[1468] = g;
                f[1469] = h;
                f[1471] = 0;
                f[1470] = b;
                b = (a + 24) | 0;
                do {
                  v = b;
                  b = (b + 4) | 0;
                  f[b >> 2] = 7;
                } while (((v + 8) | 0) >>> 0 < w >>> 0);
                if ((a | 0) != (j | 0)) {
                  g = (a - j) | 0;
                  f[c >> 2] = f[c >> 2] & -2;
                  f[(j + 4) >> 2] = g | 1;
                  f[a >> 2] = g;
                  b = 3 ? g >>> 3 : g;
                  if (g >>> 0 < 256) {
                    c = (5464 + ((b << 1) << 2)) | 0;
                    a = f[1356] | 0;
                    b = 1 << b;
                    if (!(a & b)) {
                      f[1356] = a | b;
                      b = c;
                      a = (c + 8) | 0;
                    } else {
                      a = (c + 8) | 0;
                      b = f[a >> 2] | 0;
                    }
                    f[a >> 2] = j;
                    f[(b + 12) >> 2] = j;
                    f[(j + 8) >> 2] = b;
                    f[(j + 12) >> 2] = c;
                    break;
                  }
                  b = 8 ? g >>> 8 : g;
                  if (b)
                    if (g >>> 0 > 16777215) d = 31;
                    else {
                      v = (b + 1048320) | 0;
                      v = (16 ? v >>> 16 : v) & 8;
                      d = b << v;
                      u = (d + 520192) | 0;
                      u = (16 ? u >>> 16 : u) & 4;
                      d = d << u;
                      w = (d + 245760) | 0;
                      w = (16 ? w >>> 16 : w) & 2;
                      d = d << w;
                      d = (14 - (u | v | w) + (15 ? d >>> 15 : d)) | 0;
                      w = (d + 7) | 0;
                      d = ((w ? g >>> w : g) & 1) | (d << 1);
                    }
                  else d = 0;
                  c = (5728 + (d << 2)) | 0;
                  f[(j + 28) >> 2] = d;
                  f[(j + 20) >> 2] = 0;
                  f[e >> 2] = 0;
                  b = f[1357] | 0;
                  a = 1 << d;
                  if (!(b & a)) {
                    f[1357] = b | a;
                    f[c >> 2] = j;
                    f[(j + 24) >> 2] = c;
                    f[(j + 12) >> 2] = j;
                    f[(j + 8) >> 2] = j;
                    break;
                  }
                  b = f[c >> 2] | 0;
                  j: do {
                    if (((f[(b + 4) >> 2] & -8) | 0) != (g | 0)) {
                      d = g << ((d | 0) == 31 ? 0 : (25 - (1 ? d >>> 1 : d)) | 0);
                      while (1) {
                        c = (b + 16 + ((31 ? d >>> 31 : d) << 2)) | 0;
                        a = f[c >> 2] | 0;
                        if (!a) break;
                        if (((f[(a + 4) >> 2] & -8) | 0) == (g | 0)) {
                          b = a;
                          break j;
                        } else {
                          d = d << 1;
                          b = a;
                        }
                      }
                      f[c >> 2] = j;
                      f[(j + 24) >> 2] = b;
                      f[(j + 12) >> 2] = j;
                      f[(j + 8) >> 2] = j;
                      break f;
                    }
                  } while (0);
                  v = (b + 8) | 0;
                  w = f[v >> 2] | 0;
                  f[(w + 12) >> 2] = j;
                  f[v >> 2] = j;
                  f[(j + 8) >> 2] = w;
                  f[(j + 12) >> 2] = b;
                  f[(j + 24) >> 2] = 0;
                }
              } else {
                w = f[1360] | 0;
                if (((w | 0) == 0) | (g >>> 0 < w >>> 0)) f[1360] = g;
                f[1468] = g;
                f[1469] = h;
                f[1471] = 0;
                f[1365] = f[1474];
                f[1364] = -1;
                f[1369] = 5464;
                f[1368] = 5464;
                f[1371] = 5472;
                f[1370] = 5472;
                f[1373] = 5480;
                f[1372] = 5480;
                f[1375] = 5488;
                f[1374] = 5488;
                f[1377] = 5496;
                f[1376] = 5496;
                f[1379] = 5504;
                f[1378] = 5504;
                f[1381] = 5512;
                f[1380] = 5512;
                f[1383] = 5520;
                f[1382] = 5520;
                f[1385] = 5528;
                f[1384] = 5528;
                f[1387] = 5536;
                f[1386] = 5536;
                f[1389] = 5544;
                f[1388] = 5544;
                f[1391] = 5552;
                f[1390] = 5552;
                f[1393] = 5560;
                f[1392] = 5560;
                f[1395] = 5568;
                f[1394] = 5568;
                f[1397] = 5576;
                f[1396] = 5576;
                f[1399] = 5584;
                f[1398] = 5584;
                f[1401] = 5592;
                f[1400] = 5592;
                f[1403] = 5600;
                f[1402] = 5600;
                f[1405] = 5608;
                f[1404] = 5608;
                f[1407] = 5616;
                f[1406] = 5616;
                f[1409] = 5624;
                f[1408] = 5624;
                f[1411] = 5632;
                f[1410] = 5632;
                f[1413] = 5640;
                f[1412] = 5640;
                f[1415] = 5648;
                f[1414] = 5648;
                f[1417] = 5656;
                f[1416] = 5656;
                f[1419] = 5664;
                f[1418] = 5664;
                f[1421] = 5672;
                f[1420] = 5672;
                f[1423] = 5680;
                f[1422] = 5680;
                f[1425] = 5688;
                f[1424] = 5688;
                f[1427] = 5696;
                f[1426] = 5696;
                f[1429] = 5704;
                f[1428] = 5704;
                f[1431] = 5712;
                f[1430] = 5712;
                w = (h + -40) | 0;
                u = (g + 8) | 0;
                u = ((u & 7) | 0) == 0 ? 0 : (0 - u) & 7;
                v = (g + u) | 0;
                u = (w - u) | 0;
                f[1362] = v;
                f[1359] = u;
                f[(v + 4) >> 2] = u | 1;
                f[(g + w + 4) >> 2] = 40;
                f[1363] = f[1478];
              }
            } while (0);
            b = f[1359] | 0;
            if (b >>> 0 > m >>> 0) {
              u = (b - m) | 0;
              f[1359] = u;
              w = f[1362] | 0;
              v = (w + m) | 0;
              f[1362] = v;
              f[(v + 4) >> 2] = u | 1;
              f[(w + 4) >> 2] = m | 3;
              w = (w + 8) | 0;
              t = x;
              return w | 0;
            }
          }
          w = Mb() | 0;
          f[w >> 2] = 12;
          w = 0;
          t = x;
          return w | 0;
        }
        function Eb(a) {
          a = a | 0;
          var b = 0,
            c = 0,
            d = 0,
            e = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0;
          if (!a) return;
          c = (a + -8) | 0;
          e = f[1360] | 0;
          a = f[(a + -4) >> 2] | 0;
          b = a & -8;
          j = (c + b) | 0;
          do {
            if (!(a & 1)) {
              d = f[c >> 2] | 0;
              if (!(a & 3)) return;
              h = (c + (0 - d)) | 0;
              g = (d + b) | 0;
              if (h >>> 0 < e >>> 0) return;
              if ((f[1361] | 0) == (h | 0)) {
                a = (j + 4) | 0;
                b = f[a >> 2] | 0;
                if (((b & 3) | 0) != 3) {
                  i = h;
                  b = g;
                  break;
                }
                f[1358] = g;
                f[a >> 2] = b & -2;
                f[(h + 4) >> 2] = g | 1;
                f[(h + g) >> 2] = g;
                return;
              }
              c = 3 ? d >>> 3 : d;
              if (d >>> 0 < 256) {
                a = f[(h + 8) >> 2] | 0;
                b = f[(h + 12) >> 2] | 0;
                if ((b | 0) == (a | 0)) {
                  f[1356] = f[1356] & ~(1 << c);
                  i = h;
                  b = g;
                  break;
                } else {
                  f[(a + 12) >> 2] = b;
                  f[(b + 8) >> 2] = a;
                  i = h;
                  b = g;
                  break;
                }
              }
              e = f[(h + 24) >> 2] | 0;
              a = f[(h + 12) >> 2] | 0;
              do {
                if ((a | 0) == (h | 0)) {
                  b = (h + 16) | 0;
                  c = (b + 4) | 0;
                  a = f[c >> 2] | 0;
                  if (!a) {
                    a = f[b >> 2] | 0;
                    if (!a) {
                      a = 0;
                      break;
                    }
                  } else b = c;
                  while (1) {
                    d = (a + 20) | 0;
                    c = f[d >> 2] | 0;
                    if (!c) {
                      d = (a + 16) | 0;
                      c = f[d >> 2] | 0;
                      if (!c) break;
                      else {
                        a = c;
                        b = d;
                      }
                    } else {
                      a = c;
                      b = d;
                    }
                  }
                  f[b >> 2] = 0;
                } else {
                  i = f[(h + 8) >> 2] | 0;
                  f[(i + 12) >> 2] = a;
                  f[(a + 8) >> 2] = i;
                }
              } while (0);
              if (e) {
                b = f[(h + 28) >> 2] | 0;
                c = (5728 + (b << 2)) | 0;
                if ((f[c >> 2] | 0) == (h | 0)) {
                  f[c >> 2] = a;
                  if (!a) {
                    f[1357] = f[1357] & ~(1 << b);
                    i = h;
                    b = g;
                    break;
                  }
                } else {
                  i = (e + 16) | 0;
                  f[((f[i >> 2] | 0) == (h | 0) ? i : (e + 20) | 0) >> 2] = a;
                  if (!a) {
                    i = h;
                    b = g;
                    break;
                  }
                }
                f[(a + 24) >> 2] = e;
                b = (h + 16) | 0;
                c = f[b >> 2] | 0;
                if (c | 0) {
                  f[(a + 16) >> 2] = c;
                  f[(c + 24) >> 2] = a;
                }
                b = f[(b + 4) >> 2] | 0;
                if (b) {
                  f[(a + 20) >> 2] = b;
                  f[(b + 24) >> 2] = a;
                  i = h;
                  b = g;
                } else {
                  i = h;
                  b = g;
                }
              } else {
                i = h;
                b = g;
              }
            } else {
              i = c;
              h = c;
            }
          } while (0);
          if (h >>> 0 >= j >>> 0) return;
          a = (j + 4) | 0;
          d = f[a >> 2] | 0;
          if (!(d & 1)) return;
          if (!(d & 2)) {
            if ((f[1362] | 0) == (j | 0)) {
              j = ((f[1359] | 0) + b) | 0;
              f[1359] = j;
              f[1362] = i;
              f[(i + 4) >> 2] = j | 1;
              if ((i | 0) != (f[1361] | 0)) return;
              f[1361] = 0;
              f[1358] = 0;
              return;
            }
            if ((f[1361] | 0) == (j | 0)) {
              j = ((f[1358] | 0) + b) | 0;
              f[1358] = j;
              f[1361] = h;
              f[(i + 4) >> 2] = j | 1;
              f[(h + j) >> 2] = j;
              return;
            }
            e = ((d & -8) + b) | 0;
            c = 3 ? d >>> 3 : d;
            do {
              if (d >>> 0 < 256) {
                b = f[(j + 8) >> 2] | 0;
                a = f[(j + 12) >> 2] | 0;
                if ((a | 0) == (b | 0)) {
                  f[1356] = f[1356] & ~(1 << c);
                  break;
                } else {
                  f[(b + 12) >> 2] = a;
                  f[(a + 8) >> 2] = b;
                  break;
                }
              } else {
                g = f[(j + 24) >> 2] | 0;
                a = f[(j + 12) >> 2] | 0;
                do {
                  if ((a | 0) == (j | 0)) {
                    b = (j + 16) | 0;
                    c = (b + 4) | 0;
                    a = f[c >> 2] | 0;
                    if (!a) {
                      a = f[b >> 2] | 0;
                      if (!a) {
                        c = 0;
                        break;
                      }
                    } else b = c;
                    while (1) {
                      d = (a + 20) | 0;
                      c = f[d >> 2] | 0;
                      if (!c) {
                        d = (a + 16) | 0;
                        c = f[d >> 2] | 0;
                        if (!c) break;
                        else {
                          a = c;
                          b = d;
                        }
                      } else {
                        a = c;
                        b = d;
                      }
                    }
                    f[b >> 2] = 0;
                    c = a;
                  } else {
                    c = f[(j + 8) >> 2] | 0;
                    f[(c + 12) >> 2] = a;
                    f[(a + 8) >> 2] = c;
                    c = a;
                  }
                } while (0);
                if (g | 0) {
                  a = f[(j + 28) >> 2] | 0;
                  b = (5728 + (a << 2)) | 0;
                  if ((f[b >> 2] | 0) == (j | 0)) {
                    f[b >> 2] = c;
                    if (!c) {
                      f[1357] = f[1357] & ~(1 << a);
                      break;
                    }
                  } else {
                    d = (g + 16) | 0;
                    f[((f[d >> 2] | 0) == (j | 0) ? d : (g + 20) | 0) >> 2] = c;
                    if (!c) break;
                  }
                  f[(c + 24) >> 2] = g;
                  a = (j + 16) | 0;
                  b = f[a >> 2] | 0;
                  if (b | 0) {
                    f[(c + 16) >> 2] = b;
                    f[(b + 24) >> 2] = c;
                  }
                  a = f[(a + 4) >> 2] | 0;
                  if (a | 0) {
                    f[(c + 20) >> 2] = a;
                    f[(a + 24) >> 2] = c;
                  }
                }
              }
            } while (0);
            f[(i + 4) >> 2] = e | 1;
            f[(h + e) >> 2] = e;
            if ((i | 0) == (f[1361] | 0)) {
              f[1358] = e;
              return;
            }
          } else {
            f[a >> 2] = d & -2;
            f[(i + 4) >> 2] = b | 1;
            f[(h + b) >> 2] = b;
            e = b;
          }
          a = 3 ? e >>> 3 : e;
          if (e >>> 0 < 256) {
            c = (5464 + ((a << 1) << 2)) | 0;
            b = f[1356] | 0;
            a = 1 << a;
            if (!(b & a)) {
              f[1356] = b | a;
              a = c;
              b = (c + 8) | 0;
            } else {
              b = (c + 8) | 0;
              a = f[b >> 2] | 0;
            }
            f[b >> 2] = i;
            f[(a + 12) >> 2] = i;
            f[(i + 8) >> 2] = a;
            f[(i + 12) >> 2] = c;
            return;
          }
          a = 8 ? e >>> 8 : e;
          if (a)
            if (e >>> 0 > 16777215) d = 31;
            else {
              h = (a + 1048320) | 0;
              h = (16 ? h >>> 16 : h) & 8;
              d = a << h;
              g = (d + 520192) | 0;
              g = (16 ? g >>> 16 : g) & 4;
              d = d << g;
              j = (d + 245760) | 0;
              j = (16 ? j >>> 16 : j) & 2;
              d = d << j;
              d = (14 - (g | h | j) + (15 ? d >>> 15 : d)) | 0;
              j = (d + 7) | 0;
              d = ((j ? e >>> j : e) & 1) | (d << 1);
            }
          else d = 0;
          a = (5728 + (d << 2)) | 0;
          f[(i + 28) >> 2] = d;
          f[(i + 20) >> 2] = 0;
          f[(i + 16) >> 2] = 0;
          b = f[1357] | 0;
          c = 1 << d;
          a: do {
            if (!(b & c)) {
              f[1357] = b | c;
              f[a >> 2] = i;
              f[(i + 24) >> 2] = a;
              f[(i + 12) >> 2] = i;
              f[(i + 8) >> 2] = i;
            } else {
              a = f[a >> 2] | 0;
              b: do {
                if (((f[(a + 4) >> 2] & -8) | 0) != (e | 0)) {
                  d = e << ((d | 0) == 31 ? 0 : (25 - (1 ? d >>> 1 : d)) | 0);
                  while (1) {
                    c = (a + 16 + ((31 ? d >>> 31 : d) << 2)) | 0;
                    b = f[c >> 2] | 0;
                    if (!b) break;
                    if (((f[(b + 4) >> 2] & -8) | 0) == (e | 0)) {
                      a = b;
                      break b;
                    } else {
                      d = d << 1;
                      a = b;
                    }
                  }
                  f[c >> 2] = i;
                  f[(i + 24) >> 2] = a;
                  f[(i + 12) >> 2] = i;
                  f[(i + 8) >> 2] = i;
                  break a;
                }
              } while (0);
              h = (a + 8) | 0;
              j = f[h >> 2] | 0;
              f[(j + 12) >> 2] = i;
              f[h >> 2] = i;
              f[(i + 8) >> 2] = j;
              f[(i + 12) >> 2] = a;
              f[(i + 24) >> 2] = 0;
            }
          } while (0);
          j = ((f[1364] | 0) + -1) | 0;
          f[1364] = j;
          if (j | 0) return;
          a = 5880;
          while (1) {
            a = f[a >> 2] | 0;
            if (!a) break;
            else a = (a + 8) | 0;
          }
          f[1364] = -1;
          return;
        }
        function Fb(a, b) {
          a = a | 0;
          b = b | 0;
          var c = 0,
            d = 0,
            e = 0,
            g = 0,
            h = 0,
            i = 0;
          i = (a + b) | 0;
          c = f[(a + 4) >> 2] | 0;
          do {
            if (!(c & 1)) {
              e = f[a >> 2] | 0;
              if (!(c & 3)) return;
              h = (a + (0 - e)) | 0;
              b = (e + b) | 0;
              if ((f[1361] | 0) == (h | 0)) {
                a = (i + 4) | 0;
                c = f[a >> 2] | 0;
                if (((c & 3) | 0) != 3) break;
                f[1358] = b;
                f[a >> 2] = c & -2;
                f[(h + 4) >> 2] = b | 1;
                f[i >> 2] = b;
                return;
              }
              d = 3 ? e >>> 3 : e;
              if (e >>> 0 < 256) {
                a = f[(h + 8) >> 2] | 0;
                c = f[(h + 12) >> 2] | 0;
                if ((c | 0) == (a | 0)) {
                  f[1356] = f[1356] & ~(1 << d);
                  break;
                } else {
                  f[(a + 12) >> 2] = c;
                  f[(c + 8) >> 2] = a;
                  break;
                }
              }
              g = f[(h + 24) >> 2] | 0;
              a = f[(h + 12) >> 2] | 0;
              do {
                if ((a | 0) == (h | 0)) {
                  c = (h + 16) | 0;
                  d = (c + 4) | 0;
                  a = f[d >> 2] | 0;
                  if (!a) {
                    a = f[c >> 2] | 0;
                    if (!a) {
                      a = 0;
                      break;
                    }
                  } else c = d;
                  while (1) {
                    e = (a + 20) | 0;
                    d = f[e >> 2] | 0;
                    if (!d) {
                      e = (a + 16) | 0;
                      d = f[e >> 2] | 0;
                      if (!d) break;
                      else {
                        a = d;
                        c = e;
                      }
                    } else {
                      a = d;
                      c = e;
                    }
                  }
                  f[c >> 2] = 0;
                } else {
                  e = f[(h + 8) >> 2] | 0;
                  f[(e + 12) >> 2] = a;
                  f[(a + 8) >> 2] = e;
                }
              } while (0);
              if (g) {
                c = f[(h + 28) >> 2] | 0;
                d = (5728 + (c << 2)) | 0;
                if ((f[d >> 2] | 0) == (h | 0)) {
                  f[d >> 2] = a;
                  if (!a) {
                    f[1357] = f[1357] & ~(1 << c);
                    break;
                  }
                } else {
                  e = (g + 16) | 0;
                  f[((f[e >> 2] | 0) == (h | 0) ? e : (g + 20) | 0) >> 2] = a;
                  if (!a) break;
                }
                f[(a + 24) >> 2] = g;
                c = (h + 16) | 0;
                d = f[c >> 2] | 0;
                if (d | 0) {
                  f[(a + 16) >> 2] = d;
                  f[(d + 24) >> 2] = a;
                }
                c = f[(c + 4) >> 2] | 0;
                if (c) {
                  f[(a + 20) >> 2] = c;
                  f[(c + 24) >> 2] = a;
                }
              }
            } else h = a;
          } while (0);
          a = (i + 4) | 0;
          d = f[a >> 2] | 0;
          if (!(d & 2)) {
            if ((f[1362] | 0) == (i | 0)) {
              i = ((f[1359] | 0) + b) | 0;
              f[1359] = i;
              f[1362] = h;
              f[(h + 4) >> 2] = i | 1;
              if ((h | 0) != (f[1361] | 0)) return;
              f[1361] = 0;
              f[1358] = 0;
              return;
            }
            if ((f[1361] | 0) == (i | 0)) {
              i = ((f[1358] | 0) + b) | 0;
              f[1358] = i;
              f[1361] = h;
              f[(h + 4) >> 2] = i | 1;
              f[(h + i) >> 2] = i;
              return;
            }
            e = ((d & -8) + b) | 0;
            c = 3 ? d >>> 3 : d;
            do {
              if (d >>> 0 < 256) {
                a = f[(i + 8) >> 2] | 0;
                b = f[(i + 12) >> 2] | 0;
                if ((b | 0) == (a | 0)) {
                  f[1356] = f[1356] & ~(1 << c);
                  break;
                } else {
                  f[(a + 12) >> 2] = b;
                  f[(b + 8) >> 2] = a;
                  break;
                }
              } else {
                g = f[(i + 24) >> 2] | 0;
                b = f[(i + 12) >> 2] | 0;
                do {
                  if ((b | 0) == (i | 0)) {
                    a = (i + 16) | 0;
                    c = (a + 4) | 0;
                    b = f[c >> 2] | 0;
                    if (!b) {
                      b = f[a >> 2] | 0;
                      if (!b) {
                        c = 0;
                        break;
                      }
                    } else a = c;
                    while (1) {
                      d = (b + 20) | 0;
                      c = f[d >> 2] | 0;
                      if (!c) {
                        d = (b + 16) | 0;
                        c = f[d >> 2] | 0;
                        if (!c) break;
                        else {
                          b = c;
                          a = d;
                        }
                      } else {
                        b = c;
                        a = d;
                      }
                    }
                    f[a >> 2] = 0;
                    c = b;
                  } else {
                    c = f[(i + 8) >> 2] | 0;
                    f[(c + 12) >> 2] = b;
                    f[(b + 8) >> 2] = c;
                    c = b;
                  }
                } while (0);
                if (g | 0) {
                  b = f[(i + 28) >> 2] | 0;
                  a = (5728 + (b << 2)) | 0;
                  if ((f[a >> 2] | 0) == (i | 0)) {
                    f[a >> 2] = c;
                    if (!c) {
                      f[1357] = f[1357] & ~(1 << b);
                      break;
                    }
                  } else {
                    d = (g + 16) | 0;
                    f[((f[d >> 2] | 0) == (i | 0) ? d : (g + 20) | 0) >> 2] = c;
                    if (!c) break;
                  }
                  f[(c + 24) >> 2] = g;
                  b = (i + 16) | 0;
                  a = f[b >> 2] | 0;
                  if (a | 0) {
                    f[(c + 16) >> 2] = a;
                    f[(a + 24) >> 2] = c;
                  }
                  b = f[(b + 4) >> 2] | 0;
                  if (b | 0) {
                    f[(c + 20) >> 2] = b;
                    f[(b + 24) >> 2] = c;
                  }
                }
              }
            } while (0);
            f[(h + 4) >> 2] = e | 1;
            f[(h + e) >> 2] = e;
            if ((h | 0) == (f[1361] | 0)) {
              f[1358] = e;
              return;
            }
          } else {
            f[a >> 2] = d & -2;
            f[(h + 4) >> 2] = b | 1;
            f[(h + b) >> 2] = b;
            e = b;
          }
          b = 3 ? e >>> 3 : e;
          if (e >>> 0 < 256) {
            c = (5464 + ((b << 1) << 2)) | 0;
            a = f[1356] | 0;
            b = 1 << b;
            if (!(a & b)) {
              f[1356] = a | b;
              b = c;
              a = (c + 8) | 0;
            } else {
              a = (c + 8) | 0;
              b = f[a >> 2] | 0;
            }
            f[a >> 2] = h;
            f[(b + 12) >> 2] = h;
            f[(h + 8) >> 2] = b;
            f[(h + 12) >> 2] = c;
            return;
          }
          b = 8 ? e >>> 8 : e;
          if (b)
            if (e >>> 0 > 16777215) d = 31;
            else {
              g = (b + 1048320) | 0;
              g = (16 ? g >>> 16 : g) & 8;
              d = b << g;
              c = (d + 520192) | 0;
              c = (16 ? c >>> 16 : c) & 4;
              d = d << c;
              i = (d + 245760) | 0;
              i = (16 ? i >>> 16 : i) & 2;
              d = d << i;
              d = (14 - (c | g | i) + (15 ? d >>> 15 : d)) | 0;
              i = (d + 7) | 0;
              d = ((i ? e >>> i : e) & 1) | (d << 1);
            }
          else d = 0;
          b = (5728 + (d << 2)) | 0;
          f[(h + 28) >> 2] = d;
          f[(h + 20) >> 2] = 0;
          f[(h + 16) >> 2] = 0;
          a = f[1357] | 0;
          c = 1 << d;
          if (!(a & c)) {
            f[1357] = a | c;
            f[b >> 2] = h;
            f[(h + 24) >> 2] = b;
            f[(h + 12) >> 2] = h;
            f[(h + 8) >> 2] = h;
            return;
          }
          b = f[b >> 2] | 0;
          a: do {
            if (((f[(b + 4) >> 2] & -8) | 0) != (e | 0)) {
              d = e << ((d | 0) == 31 ? 0 : (25 - (1 ? d >>> 1 : d)) | 0);
              while (1) {
                c = (b + 16 + ((31 ? d >>> 31 : d) << 2)) | 0;
                a = f[c >> 2] | 0;
                if (!a) break;
                if (((f[(a + 4) >> 2] & -8) | 0) == (e | 0)) {
                  b = a;
                  break a;
                } else {
                  d = d << 1;
                  b = a;
                }
              }
              f[c >> 2] = h;
              f[(h + 24) >> 2] = b;
              f[(h + 12) >> 2] = h;
              f[(h + 8) >> 2] = h;
              return;
            }
          } while (0);
          g = (b + 8) | 0;
          i = f[g >> 2] | 0;
          f[(i + 12) >> 2] = h;
          f[g >> 2] = h;
          f[(h + 8) >> 2] = i;
          f[(h + 12) >> 2] = b;
          f[(h + 24) >> 2] = 0;
          return;
        }
        function Gb(a, b) {
          a = a | 0;
          b = b | 0;
          var c = 0,
            d = 0,
            e = 0,
            g = 0,
            h = 0,
            i = 0;
          c = a >>> 0 > 16 ? a : 16;
          if (!((c + -1) & c)) a = c;
          else {
            a = 16;
            while (1)
              if (a >>> 0 < c >>> 0) a = a << 1;
              else break;
          }
          if (((-64 - a) | 0) >>> 0 <= b >>> 0) {
            h = Mb() | 0;
            f[h >> 2] = 12;
            h = 0;
            return h | 0;
          }
          g = b >>> 0 < 11 ? 16 : (b + 11) & -8;
          c = Db((g + 12 + a) | 0) | 0;
          if (!c) {
            h = 0;
            return h | 0;
          }
          e = (c + -8) | 0;
          do {
            if ((a + -1) & c) {
              d = (((c + a + -1) & (0 - a)) + -8) | 0;
              b = e;
              d = ((d - b) | 0) >>> 0 > 15 ? d : (d + a) | 0;
              b = (d - b) | 0;
              a = (c + -4) | 0;
              i = f[a >> 2] | 0;
              c = ((i & -8) - b) | 0;
              if (!(i & 3)) {
                f[d >> 2] = (f[e >> 2] | 0) + b;
                f[(d + 4) >> 2] = c;
                a = d;
                b = d;
                break;
              } else {
                i = (d + 4) | 0;
                f[i >> 2] = c | (f[i >> 2] & 1) | 2;
                c = (d + c + 4) | 0;
                f[c >> 2] = f[c >> 2] | 1;
                f[a >> 2] = b | (f[a >> 2] & 1) | 2;
                f[i >> 2] = f[i >> 2] | 1;
                Fb(e, b);
                a = d;
                b = d;
                break;
              }
            } else {
              a = e;
              b = e;
            }
          } while (0);
          a = (a + 4) | 0;
          c = f[a >> 2] | 0;
          if ((c & 3) | 0 ? ((h = c & -8), h >>> 0 > ((g + 16) | 0) >>> 0) : 0) {
            i = (h - g) | 0;
            e = (b + g) | 0;
            f[a >> 2] = g | (c & 1) | 2;
            f[(e + 4) >> 2] = i | 3;
            h = (b + h + 4) | 0;
            f[h >> 2] = f[h >> 2] | 1;
            Fb(e, i);
          }
          i = (b + 8) | 0;
          return i | 0;
        }
        function Hb(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          var d = 0;
          do {
            if ((b | 0) != 8) {
              d = 2 ? b >>> 2 : b;
              if ((((b & 3) | 0) != 0) | ((d | 0) == 0)) {
                a = 22;
                return a | 0;
              }
              if (((d + 1073741823) & d) | 0) {
                a = 22;
                return a | 0;
              }
              if (((-64 - b) | 0) >>> 0 < c >>> 0) {
                a = 12;
                return a | 0;
              } else {
                b = Gb(b >>> 0 > 16 ? b : 16, c) | 0;
                break;
              }
            } else b = Db(c) | 0;
          } while (0);
          if (!b) {
            a = 12;
            return a | 0;
          }
          f[a >> 2] = b;
          a = 0;
          return a | 0;
        }
        function Ib(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          b = t;
          t = (t + 16) | 0;
          c = b;
          a = Nb(f[(a + 60) >> 2] | 0) | 0;
          f[c >> 2] = a;
          a = Lb(ha(6, c | 0) | 0) | 0;
          t = b;
          return a | 0;
        }
        function Jb(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          var d = 0,
            e = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0;
          m = t;
          t = (t + 48) | 0;
          k = (m + 32) | 0;
          g = (m + 16) | 0;
          e = m;
          i = (a + 28) | 0;
          d = f[i >> 2] | 0;
          f[e >> 2] = d;
          j = (a + 20) | 0;
          d = ((f[j >> 2] | 0) - d) | 0;
          f[(e + 4) >> 2] = d;
          f[(e + 8) >> 2] = b;
          f[(e + 12) >> 2] = c;
          d = (d + c) | 0;
          h = (a + 60) | 0;
          f[g >> 2] = f[h >> 2];
          f[(g + 4) >> 2] = e;
          f[(g + 8) >> 2] = 2;
          g = Lb(fa(146, g | 0) | 0) | 0;
          a: do {
            if ((d | 0) != (g | 0)) {
              b = 2;
              while (1) {
                if ((g | 0) < 0) break;
                d = (d - g) | 0;
                o = f[(e + 4) >> 2] | 0;
                n = g >>> 0 > o >>> 0;
                e = n ? (e + 8) | 0 : e;
                b = (b + ((n << 31) >> 31)) | 0;
                o = (g - (n ? o : 0)) | 0;
                f[e >> 2] = (f[e >> 2] | 0) + o;
                n = (e + 4) | 0;
                f[n >> 2] = (f[n >> 2] | 0) - o;
                f[k >> 2] = f[h >> 2];
                f[(k + 4) >> 2] = e;
                f[(k + 8) >> 2] = b;
                g = Lb(fa(146, k | 0) | 0) | 0;
                if ((d | 0) == (g | 0)) {
                  l = 3;
                  break a;
                }
              }
              f[(a + 16) >> 2] = 0;
              f[i >> 2] = 0;
              f[j >> 2] = 0;
              f[a >> 2] = f[a >> 2] | 32;
              if ((b | 0) == 2) c = 0;
              else c = (c - (f[(e + 4) >> 2] | 0)) | 0;
            } else l = 3;
          } while (0);
          if ((l | 0) == 3) {
            o = f[(a + 44) >> 2] | 0;
            f[(a + 16) >> 2] = o + (f[(a + 48) >> 2] | 0);
            f[i >> 2] = o;
            f[j >> 2] = o;
          }
          t = m;
          return c | 0;
        }
        function Kb(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          var d = 0,
            e = 0,
            g = 0;
          e = t;
          t = (t + 32) | 0;
          g = e;
          d = (e + 20) | 0;
          f[g >> 2] = f[(a + 60) >> 2];
          f[(g + 4) >> 2] = 0;
          f[(g + 8) >> 2] = b;
          f[(g + 12) >> 2] = d;
          f[(g + 16) >> 2] = c;
          if ((Lb(ea(140, g | 0) | 0) | 0) < 0) {
            f[d >> 2] = -1;
            a = -1;
          } else a = f[d >> 2] | 0;
          t = e;
          return a | 0;
        }
        function Lb(a) {
          a = a | 0;
          var b = 0;
          if (a >>> 0 > 4294963200) {
            b = Mb() | 0;
            f[b >> 2] = 0 - a;
            a = -1;
          }
          return a | 0;
        }
        function Mb() {
          return 5984;
        }
        function Nb(a) {
          a = a | 0;
          return a | 0;
        }
        function Ob(a, c, d) {
          a = a | 0;
          c = c | 0;
          d = d | 0;
          var e = 0,
            g = 0;
          g = t;
          t = (t + 32) | 0;
          e = g;
          f[(a + 36) >> 2] = 4;
          if (((f[a >> 2] & 64) | 0) == 0 ? ((f[e >> 2] = f[(a + 60) >> 2]), (f[(e + 4) >> 2] = 21523), (f[(e + 8) >> 2] = g + 16), ga(54, e | 0) | 0) : 0) b[(a + 75) >> 0] = -1;
          e = Jb(a, c, d) | 0;
          t = g;
          return e | 0;
        }
        function Pb(a, c) {
          a = a | 0;
          c = c | 0;
          var d = 0,
            e = 0;
          d = b[a >> 0] | 0;
          e = b[c >> 0] | 0;
          if ((d << 24) >> 24 == 0 ? 1 : (d << 24) >> 24 != (e << 24) >> 24) a = e;
          else {
            do {
              a = (a + 1) | 0;
              c = (c + 1) | 0;
              d = b[a >> 0] | 0;
              e = b[c >> 0] | 0;
            } while (!((d << 24) >> 24 == 0 ? 1 : (d << 24) >> 24 != (e << 24) >> 24));
            a = e;
          }
          return ((d & 255) - (a & 255)) | 0;
        }
        function Qb(a, c, d) {
          a = a | 0;
          c = c | 0;
          d = d | 0;
          var e = 0,
            f = 0;
          if (!d) e = 0;
          else {
            e = b[a >> 0] | 0;
            a: do {
              if (!((e << 24) >> 24)) e = 0;
              else
                while (1) {
                  d = (d + -1) | 0;
                  f = b[c >> 0] | 0;
                  if (!(((e << 24) >> 24 == (f << 24) >> 24) & (((d | 0) != 0) & ((f << 24) >> 24 != 0)))) break a;
                  a = (a + 1) | 0;
                  c = (c + 1) | 0;
                  e = b[a >> 0] | 0;
                  if (!((e << 24) >> 24)) {
                    e = 0;
                    break;
                  }
                }
            } while (0);
            e = ((e & 255) - (h[c >> 0] | 0)) | 0;
          }
          return e | 0;
        }
        function Rb(a) {
          a = a | 0;
          return (((a + -48) | 0) >>> 0 < 10) | 0;
        }
        function Sb(a, c, d, e) {
          a = a | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          var g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0;
          m = t;
          t = (t + 128) | 0;
          g = (m + 124) | 0;
          l = m;
          h = l;
          i = 2528;
          j = (h + 124) | 0;
          do {
            f[h >> 2] = f[i >> 2];
            h = (h + 4) | 0;
            i = (i + 4) | 0;
          } while ((h | 0) < (j | 0));
          if (((c + -1) | 0) >>> 0 > 2147483646)
            if (!c) {
              a = g;
              c = 1;
              k = 4;
            } else {
              c = Mb() | 0;
              f[c >> 2] = 75;
              c = -1;
            }
          else k = 4;
          if ((k | 0) == 4) {
            k = (-2 - a) | 0;
            k = c >>> 0 > k >>> 0 ? k : c;
            f[(l + 48) >> 2] = k;
            g = (l + 20) | 0;
            f[g >> 2] = a;
            f[(l + 44) >> 2] = a;
            c = (a + k) | 0;
            a = (l + 16) | 0;
            f[a >> 2] = c;
            f[(l + 28) >> 2] = c;
            c = Tb(l, d, e) | 0;
            if (k) {
              l = f[g >> 2] | 0;
              b[(l + ((((l | 0) == (f[a >> 2] | 0)) << 31) >> 31)) >> 0] = 0;
            }
          }
          t = m;
          return c | 0;
        }
        function Tb(a, c, d) {
          a = a | 0;
          c = c | 0;
          d = d | 0;
          var e = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0;
          r = t;
          t = (t + 224) | 0;
          m = (r + 208) | 0;
          o = (r + 160) | 0;
          p = (r + 80) | 0;
          q = r;
          e = o;
          g = (e + 40) | 0;
          do {
            f[e >> 2] = 0;
            e = (e + 4) | 0;
          } while ((e | 0) < (g | 0));
          f[m >> 2] = f[d >> 2];
          if ((Ub(0, c, m, p, o) | 0) < 0) d = -1;
          else {
            if ((f[(a + 76) >> 2] | 0) > -1) n = Vb(a) | 0;
            else n = 0;
            d = f[a >> 2] | 0;
            l = d & 32;
            if ((b[(a + 74) >> 0] | 0) < 1) f[a >> 2] = d & -33;
            e = (a + 48) | 0;
            if (!(f[e >> 2] | 0)) {
              g = (a + 44) | 0;
              h = f[g >> 2] | 0;
              f[g >> 2] = q;
              i = (a + 28) | 0;
              f[i >> 2] = q;
              j = (a + 20) | 0;
              f[j >> 2] = q;
              f[e >> 2] = 80;
              k = (a + 16) | 0;
              f[k >> 2] = q + 80;
              d = Ub(a, c, m, p, o) | 0;
              if (h) {
                na[f[(a + 36) >> 2] & 7](a, 0, 0) | 0;
                d = (f[j >> 2] | 0) == 0 ? -1 : d;
                f[g >> 2] = h;
                f[e >> 2] = 0;
                f[k >> 2] = 0;
                f[i >> 2] = 0;
                f[j >> 2] = 0;
              }
            } else d = Ub(a, c, m, p, o) | 0;
            e = f[a >> 2] | 0;
            f[a >> 2] = e | l;
            if (n | 0) Wb(a);
            d = ((e & 32) | 0) == 0 ? d : -1;
          }
          t = r;
          return d | 0;
        }
        function Ub(a, c, e, g, h) {
          a = a | 0;
          c = c | 0;
          e = e | 0;
          g = g | 0;
          h = h | 0;
          var i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            q = 0,
            r = 0,
            s = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0,
            y = 0,
            z = 0,
            A = 0,
            B = 0,
            C = 0,
            D = 0,
            E = 0,
            F = 0,
            G = 0,
            H = 0;
          H = t;
          t = (t + 64) | 0;
          C = (H + 56) | 0;
          D = (H + 40) | 0;
          z = H;
          F = (H + 48) | 0;
          G = (H + 60) | 0;
          f[C >> 2] = c;
          w = (a | 0) != 0;
          x = (z + 40) | 0;
          y = x;
          z = (z + 39) | 0;
          A = (F + 4) | 0;
          i = 0;
          c = 0;
          k = 0;
          a: while (1) {
            do {
              do {
                if ((c | 0) > -1)
                  if ((i | 0) > ((2147483647 - c) | 0)) {
                    c = Mb() | 0;
                    f[c >> 2] = 75;
                    c = -1;
                    break;
                  } else {
                    c = (i + c) | 0;
                    break;
                  }
              } while (0);
              r = f[C >> 2] | 0;
              i = b[r >> 0] | 0;
              if (!((i << 24) >> 24)) {
                v = 94;
                break a;
              }
              j = r;
              b: while (1) {
                switch ((i << 24) >> 24) {
                  case 37: {
                    v = 10;
                    break b;
                  }
                  case 0: {
                    i = j;
                    break b;
                  }
                  default: {
                  }
                }
                u = (j + 1) | 0;
                f[C >> 2] = u;
                i = b[u >> 0] | 0;
                j = u;
              }
              c: do {
                if ((v | 0) == 10) {
                  v = 0;
                  i = j;
                  do {
                    if ((b[(j + 1) >> 0] | 0) != 37) break c;
                    i = (i + 1) | 0;
                    j = (j + 2) | 0;
                    f[C >> 2] = j;
                  } while ((b[j >> 0] | 0) == 37);
                }
              } while (0);
              i = (i - r) | 0;
              if (w) Xb(a, r, i);
            } while ((i | 0) != 0);
            u = (Rb(b[((f[C >> 2] | 0) + 1) >> 0] | 0) | 0) == 0;
            j = f[C >> 2] | 0;
            if (!u ? (b[(j + 2) >> 0] | 0) == 36 : 0) {
              o = ((b[(j + 1) >> 0] | 0) + -48) | 0;
              m = 1;
              i = 3;
            } else {
              o = -1;
              m = k;
              i = 1;
            }
            i = (j + i) | 0;
            f[C >> 2] = i;
            j = b[i >> 0] | 0;
            k = (((j << 24) >> 24) + -32) | 0;
            if ((k >>> 0 > 31) | ((((1 << k) & 75913) | 0) == 0)) l = 0;
            else {
              l = 0;
              do {
                l = (1 << k) | l;
                i = (i + 1) | 0;
                f[C >> 2] = i;
                j = b[i >> 0] | 0;
                k = (((j << 24) >> 24) + -32) | 0;
              } while (!((k >>> 0 > 31) | ((((1 << k) & 75913) | 0) == 0)));
            }
            if ((j << 24) >> 24 == 42) {
              if ((Rb(b[(i + 1) >> 0] | 0) | 0) != 0 ? ((E = f[C >> 2] | 0), (b[(E + 2) >> 0] | 0) == 36) : 0) {
                i = (E + 1) | 0;
                f[(h + (((b[i >> 0] | 0) + -48) << 2)) >> 2] = 10;
                i = f[(g + (((b[i >> 0] | 0) + -48) << 3)) >> 2] | 0;
                k = 1;
                j = (E + 3) | 0;
              } else {
                if (m | 0) {
                  c = -1;
                  break;
                }
                if (w) {
                  u = ((f[e >> 2] | 0) + (4 - 1)) & ~(4 - 1);
                  i = f[u >> 2] | 0;
                  f[e >> 2] = u + 4;
                } else i = 0;
                k = 0;
                j = ((f[C >> 2] | 0) + 1) | 0;
              }
              f[C >> 2] = j;
              u = (i | 0) < 0;
              s = u ? (0 - i) | 0 : i;
              l = u ? l | 8192 : l;
              u = k;
            } else {
              i = Yb(C) | 0;
              if ((i | 0) < 0) {
                c = -1;
                break;
              }
              s = i;
              u = m;
              j = f[C >> 2] | 0;
            }
            do {
              if ((b[j >> 0] | 0) == 46) {
                i = (j + 1) | 0;
                if ((b[i >> 0] | 0) != 42) {
                  f[C >> 2] = i;
                  i = Yb(C) | 0;
                  j = f[C >> 2] | 0;
                  break;
                }
                if (Rb(b[(j + 2) >> 0] | 0) | 0 ? ((B = f[C >> 2] | 0), (b[(B + 3) >> 0] | 0) == 36) : 0) {
                  i = (B + 2) | 0;
                  f[(h + (((b[i >> 0] | 0) + -48) << 2)) >> 2] = 10;
                  i = f[(g + (((b[i >> 0] | 0) + -48) << 3)) >> 2] | 0;
                  j = (B + 4) | 0;
                  f[C >> 2] = j;
                  break;
                }
                if (u | 0) {
                  c = -1;
                  break a;
                }
                if (w) {
                  q = ((f[e >> 2] | 0) + (4 - 1)) & ~(4 - 1);
                  i = f[q >> 2] | 0;
                  f[e >> 2] = q + 4;
                } else i = 0;
                j = ((f[C >> 2] | 0) + 2) | 0;
                f[C >> 2] = j;
              } else i = -1;
            } while (0);
            q = 0;
            while (1) {
              if ((((b[j >> 0] | 0) + -65) | 0) >>> 0 > 57) {
                c = -1;
                break a;
              }
              k = j;
              j = (j + 1) | 0;
              f[C >> 2] = j;
              k = b[((b[k >> 0] | 0) + -65 + (16 + ((q * 58) | 0))) >> 0] | 0;
              m = k & 255;
              if (((m + -1) | 0) >>> 0 >= 8) break;
              else q = m;
            }
            if (!((k << 24) >> 24)) {
              c = -1;
              break;
            }
            n = (o | 0) > -1;
            do {
              if ((k << 24) >> 24 == 19)
                if (n) {
                  c = -1;
                  break a;
                } else v = 54;
              else {
                if (n) {
                  f[(h + (o << 2)) >> 2] = m;
                  n = (g + (o << 3)) | 0;
                  o = f[(n + 4) >> 2] | 0;
                  v = D;
                  f[v >> 2] = f[n >> 2];
                  f[(v + 4) >> 2] = o;
                  v = 54;
                  break;
                }
                if (!w) {
                  c = 0;
                  break a;
                }
                Zb(D, m, e);
                j = f[C >> 2] | 0;
                v = 55;
              }
            } while (0);
            if ((v | 0) == 54) {
              v = 0;
              if (w) v = 55;
              else i = 0;
            }
            d: do {
              if ((v | 0) == 55) {
                v = 0;
                j = b[(j + -1) >> 0] | 0;
                j = ((q | 0) != 0) & (((j & 15) | 0) == 3) ? j & -33 : j;
                k = l & -65537;
                o = ((l & 8192) | 0) == 0 ? l : k;
                e: do {
                  switch (j | 0) {
                    case 110:
                      switch (((q & 255) << 24) >> 24) {
                        case 0: {
                          f[f[D >> 2] >> 2] = c;
                          i = 0;
                          break d;
                        }
                        case 1: {
                          f[f[D >> 2] >> 2] = c;
                          i = 0;
                          break d;
                        }
                        case 2: {
                          i = f[D >> 2] | 0;
                          f[i >> 2] = c;
                          f[(i + 4) >> 2] = (((c | 0) < 0) << 31) >> 31;
                          i = 0;
                          break d;
                        }
                        case 3: {
                          d[f[D >> 2] >> 1] = c;
                          i = 0;
                          break d;
                        }
                        case 4: {
                          b[f[D >> 2] >> 0] = c;
                          i = 0;
                          break d;
                        }
                        case 6: {
                          f[f[D >> 2] >> 2] = c;
                          i = 0;
                          break d;
                        }
                        case 7: {
                          i = f[D >> 2] | 0;
                          f[i >> 2] = c;
                          f[(i + 4) >> 2] = (((c | 0) < 0) << 31) >> 31;
                          i = 0;
                          break d;
                        }
                        default: {
                          i = 0;
                          break d;
                        }
                      }
                    case 112: {
                      j = 120;
                      i = i >>> 0 > 8 ? i : 8;
                      k = o | 8;
                      v = 67;
                      break;
                    }
                    case 88:
                    case 120: {
                      k = o;
                      v = 67;
                      break;
                    }
                    case 111: {
                      k = D;
                      j = f[k >> 2] | 0;
                      k = f[(k + 4) >> 2] | 0;
                      n = $b(j, k, x) | 0;
                      v = (y - n) | 0;
                      l = 0;
                      m = 4318;
                      i = (((o & 8) | 0) == 0) | ((i | 0) > (v | 0)) ? i : (v + 1) | 0;
                      v = 73;
                      break;
                    }
                    case 105:
                    case 100: {
                      k = D;
                      j = f[k >> 2] | 0;
                      k = f[(k + 4) >> 2] | 0;
                      if ((k | 0) < 0) {
                        j = zc(0, 0, j | 0, k | 0) | 0;
                        k = ba() | 0;
                        l = D;
                        f[l >> 2] = j;
                        f[(l + 4) >> 2] = k;
                        l = 1;
                        m = 4318;
                        v = 72;
                        break e;
                      } else {
                        l = (((o & 2049) | 0) != 0) & 1;
                        m = ((o & 2048) | 0) == 0 ? (((o & 1) | 0) == 0 ? 4318 : 4320) : 4319;
                        v = 72;
                        break e;
                      }
                    }
                    case 117: {
                      k = D;
                      l = 0;
                      m = 4318;
                      j = f[k >> 2] | 0;
                      k = f[(k + 4) >> 2] | 0;
                      v = 72;
                      break;
                    }
                    case 99: {
                      b[z >> 0] = f[D >> 2];
                      q = z;
                      l = 0;
                      m = 4318;
                      n = 1;
                      i = y;
                      break;
                    }
                    case 109: {
                      j = Mb() | 0;
                      j = bc(f[j >> 2] | 0) | 0;
                      v = 77;
                      break;
                    }
                    case 115: {
                      j = f[D >> 2] | 0;
                      j = (j | 0) == 0 ? 4328 : j;
                      v = 77;
                      break;
                    }
                    case 67: {
                      f[F >> 2] = f[D >> 2];
                      f[A >> 2] = 0;
                      f[D >> 2] = F;
                      m = -1;
                      v = 81;
                      break;
                    }
                    case 83: {
                      if (!i) {
                        dc(a, 32, s, 0, o);
                        i = 0;
                        v = 91;
                      } else {
                        m = i;
                        v = 81;
                      }
                      break;
                    }
                    case 65:
                    case 71:
                    case 70:
                    case 69:
                    case 97:
                    case 103:
                    case 102:
                    case 101: {
                      i = fc(a, +p[D >> 3], s, i, o, j) | 0;
                      break d;
                    }
                    default: {
                      q = r;
                      l = 0;
                      m = 4318;
                      n = i;
                      k = o;
                      i = y;
                    }
                  }
                } while (0);
                f: do {
                  if ((v | 0) == 67) {
                    r = D;
                    q = f[r >> 2] | 0;
                    r = f[(r + 4) >> 2] | 0;
                    n = _b(q, r, x, j & 32) | 0;
                    m = (((k & 8) | 0) == 0) | (((q | 0) == 0) & ((r | 0) == 0));
                    l = m ? 0 : 2;
                    m = m ? 4318 : (4318 + (4 ? j >>> 4 : j)) | 0;
                    o = k;
                    j = q;
                    k = r;
                    v = 73;
                  } else if ((v | 0) == 72) {
                    n = ac(j, k, x) | 0;
                    v = 73;
                  } else if ((v | 0) == 77) {
                    v = 0;
                    r = cc(j, 0, i) | 0;
                    o = (r | 0) == 0;
                    q = j;
                    l = 0;
                    m = 4318;
                    n = o ? i : (r - j) | 0;
                    i = o ? (j + i) | 0 : r;
                  } else if ((v | 0) == 81) {
                    v = 0;
                    l = f[D >> 2] | 0;
                    i = 0;
                    while (1) {
                      j = f[l >> 2] | 0;
                      if (!j) break;
                      j = ec(G, j) | 0;
                      k = (j | 0) < 0;
                      if (k | (j >>> 0 > ((m - i) | 0) >>> 0)) {
                        v = 85;
                        break;
                      }
                      i = (j + i) | 0;
                      if (m >>> 0 > i >>> 0) l = (l + 4) | 0;
                      else break;
                    }
                    if ((v | 0) == 85) {
                      v = 0;
                      if (k) {
                        c = -1;
                        break a;
                      }
                    }
                    dc(a, 32, s, i, o);
                    if (!i) {
                      i = 0;
                      v = 91;
                    } else {
                      k = f[D >> 2] | 0;
                      l = 0;
                      while (1) {
                        j = f[k >> 2] | 0;
                        if (!j) {
                          v = 91;
                          break f;
                        }
                        j = ec(G, j) | 0;
                        l = (j + l) | 0;
                        if ((l | 0) > (i | 0)) {
                          v = 91;
                          break f;
                        }
                        Xb(a, G, j);
                        if (l >>> 0 >= i >>> 0) {
                          v = 91;
                          break;
                        } else k = (k + 4) | 0;
                      }
                    }
                  }
                } while (0);
                if ((v | 0) == 73) {
                  v = 0;
                  k = ((j | 0) != 0) | ((k | 0) != 0);
                  r = ((i | 0) != 0) | k;
                  k = (y - n + ((k ^ 1) & 1)) | 0;
                  q = r ? n : x;
                  n = r ? ((i | 0) > (k | 0) ? i : k) : 0;
                  k = (i | 0) > -1 ? o & -65537 : o;
                  i = y;
                } else if ((v | 0) == 91) {
                  v = 0;
                  dc(a, 32, s, i, o ^ 8192);
                  i = (s | 0) > (i | 0) ? s : i;
                  break;
                }
                o = (i - q) | 0;
                n = (n | 0) < (o | 0) ? o : n;
                r = (n + l) | 0;
                i = (s | 0) < (r | 0) ? r : s;
                dc(a, 32, i, r, k);
                Xb(a, m, l);
                dc(a, 48, i, r, k ^ 65536);
                dc(a, 48, n, o, 0);
                Xb(a, q, o);
                dc(a, 32, i, r, k ^ 8192);
              }
            } while (0);
            k = u;
          }
          g: do {
            if ((v | 0) == 94)
              if (!a)
                if (!k) c = 0;
                else {
                  c = 1;
                  while (1) {
                    i = f[(h + (c << 2)) >> 2] | 0;
                    if (!i) break;
                    Zb((g + (c << 3)) | 0, i, e);
                    c = (c + 1) | 0;
                    if (c >>> 0 >= 10) {
                      c = 1;
                      break g;
                    }
                  }
                  while (1) {
                    if (f[(h + (c << 2)) >> 2] | 0) {
                      c = -1;
                      break g;
                    }
                    c = (c + 1) | 0;
                    if (c >>> 0 >= 10) {
                      c = 1;
                      break;
                    }
                  }
                }
          } while (0);
          t = H;
          return c | 0;
        }
        function Vb(a) {
          a = a | 0;
          return 1;
        }
        function Wb(a) {
          a = a | 0;
          return;
        }
        function Xb(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          if (!(f[a >> 2] & 32)) sc(b, c, a) | 0;
          return;
        }
        function Yb(a) {
          a = a | 0;
          var c = 0,
            d = 0;
          if (!(Rb(b[f[a >> 2] >> 0] | 0) | 0)) c = 0;
          else {
            c = 0;
            do {
              d = f[a >> 2] | 0;
              c = (((c * 10) | 0) + -48 + (b[d >> 0] | 0)) | 0;
              d = (d + 1) | 0;
              f[a >> 2] = d;
            } while ((Rb(b[d >> 0] | 0) | 0) != 0);
          }
          return c | 0;
        }
        function Zb(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          var d = 0,
            e = 0,
            g = 0;
          a: do {
            if (b >>> 0 <= 20)
              do {
                switch (b | 0) {
                  case 9: {
                    d = ((f[c >> 2] | 0) + (4 - 1)) & ~(4 - 1);
                    b = f[d >> 2] | 0;
                    f[c >> 2] = d + 4;
                    f[a >> 2] = b;
                    break a;
                  }
                  case 10: {
                    d = ((f[c >> 2] | 0) + (4 - 1)) & ~(4 - 1);
                    b = f[d >> 2] | 0;
                    f[c >> 2] = d + 4;
                    d = a;
                    f[d >> 2] = b;
                    f[(d + 4) >> 2] = (((b | 0) < 0) << 31) >> 31;
                    break a;
                  }
                  case 11: {
                    d = ((f[c >> 2] | 0) + (4 - 1)) & ~(4 - 1);
                    b = f[d >> 2] | 0;
                    f[c >> 2] = d + 4;
                    d = a;
                    f[d >> 2] = b;
                    f[(d + 4) >> 2] = 0;
                    break a;
                  }
                  case 12: {
                    d = ((f[c >> 2] | 0) + (8 - 1)) & ~(8 - 1);
                    b = d;
                    e = f[b >> 2] | 0;
                    b = f[(b + 4) >> 2] | 0;
                    f[c >> 2] = d + 8;
                    d = a;
                    f[d >> 2] = e;
                    f[(d + 4) >> 2] = b;
                    break a;
                  }
                  case 13: {
                    e = ((f[c >> 2] | 0) + (4 - 1)) & ~(4 - 1);
                    d = f[e >> 2] | 0;
                    f[c >> 2] = e + 4;
                    d = ((d & 65535) << 16) >> 16;
                    e = a;
                    f[e >> 2] = d;
                    f[(e + 4) >> 2] = (((d | 0) < 0) << 31) >> 31;
                    break a;
                  }
                  case 14: {
                    e = ((f[c >> 2] | 0) + (4 - 1)) & ~(4 - 1);
                    d = f[e >> 2] | 0;
                    f[c >> 2] = e + 4;
                    e = a;
                    f[e >> 2] = d & 65535;
                    f[(e + 4) >> 2] = 0;
                    break a;
                  }
                  case 15: {
                    e = ((f[c >> 2] | 0) + (4 - 1)) & ~(4 - 1);
                    d = f[e >> 2] | 0;
                    f[c >> 2] = e + 4;
                    d = ((d & 255) << 24) >> 24;
                    e = a;
                    f[e >> 2] = d;
                    f[(e + 4) >> 2] = (((d | 0) < 0) << 31) >> 31;
                    break a;
                  }
                  case 16: {
                    e = ((f[c >> 2] | 0) + (4 - 1)) & ~(4 - 1);
                    d = f[e >> 2] | 0;
                    f[c >> 2] = e + 4;
                    e = a;
                    f[e >> 2] = d & 255;
                    f[(e + 4) >> 2] = 0;
                    break a;
                  }
                  case 17: {
                    e = ((f[c >> 2] | 0) + (8 - 1)) & ~(8 - 1);
                    g = +p[e >> 3];
                    f[c >> 2] = e + 8;
                    p[a >> 3] = g;
                    break a;
                  }
                  case 18: {
                    e = ((f[c >> 2] | 0) + (8 - 1)) & ~(8 - 1);
                    g = +p[e >> 3];
                    f[c >> 2] = e + 8;
                    p[a >> 3] = g;
                    break a;
                  }
                  default:
                    break a;
                }
              } while (0);
          } while (0);
          return;
        }
        function _b(a, c, d, e) {
          a = a | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          if (!(((a | 0) == 0) & ((c | 0) == 0)))
            do {
              d = (d + -1) | 0;
              b[d >> 0] = h[(480 + (a & 15)) >> 0] | 0 | e;
              a = Dc(a | 0, c | 0, 4) | 0;
              c = ba() | 0;
            } while (!(((a | 0) == 0) & ((c | 0) == 0)));
          return d | 0;
        }
        function $b(a, c, d) {
          a = a | 0;
          c = c | 0;
          d = d | 0;
          if (!(((a | 0) == 0) & ((c | 0) == 0)))
            do {
              d = (d + -1) | 0;
              b[d >> 0] = (a & 7) | 48;
              a = Dc(a | 0, c | 0, 3) | 0;
              c = ba() | 0;
            } while (!(((a | 0) == 0) & ((c | 0) == 0)));
          return d | 0;
        }
        function ac(a, c, d) {
          a = a | 0;
          c = c | 0;
          d = d | 0;
          var e = 0,
            f = 0,
            g = 0;
          if ((c >>> 0 > 0) | (((c | 0) == 0) & (a >>> 0 > 4294967295))) {
            do {
              e = a;
              a = Cc(a | 0, c | 0, 10, 0) | 0;
              f = c;
              c = ba() | 0;
              g = xc(a | 0, c | 0, 10, 0) | 0;
              g = zc(e | 0, f | 0, g | 0, ba() | 0) | 0;
              ba() | 0;
              d = (d + -1) | 0;
              b[d >> 0] = (g & 255) | 48;
            } while ((f >>> 0 > 9) | (((f | 0) == 9) & (e >>> 0 > 4294967295)));
            c = a;
          } else c = a;
          if (c)
            do {
              g = c;
              c = ((c >>> 0) / 10) | 0;
              d = (d + -1) | 0;
              b[d >> 0] = (g - ((c * 10) | 0)) | 48;
            } while (g >>> 0 >= 10);
          return d | 0;
        }
        function bc(a) {
          a = a | 0;
          var b = 0;
          b = ((mc() | 0) + 188) | 0;
          return nc(a, f[b >> 2] | 0) | 0;
        }
        function cc(a, c, d) {
          a = a | 0;
          c = c | 0;
          d = d | 0;
          var e = 0,
            g = 0,
            h = 0,
            i = 0;
          h = c & 255;
          e = (d | 0) != 0;
          a: do {
            if (e & (((a & 3) | 0) != 0)) {
              g = c & 255;
              while (1) {
                if ((b[a >> 0] | 0) == (g << 24) >> 24) {
                  i = 6;
                  break a;
                }
                a = (a + 1) | 0;
                d = (d + -1) | 0;
                e = (d | 0) != 0;
                if (!(e & (((a & 3) | 0) != 0))) {
                  i = 5;
                  break;
                }
              }
            } else i = 5;
          } while (0);
          if ((i | 0) == 5)
            if (e) i = 6;
            else i = 16;
          b: do {
            if ((i | 0) == 6) {
              g = c & 255;
              if ((b[a >> 0] | 0) == (g << 24) >> 24)
                if (!d) {
                  i = 16;
                  break;
                } else break;
              e = U(h, 16843009) | 0;
              c: do {
                if (d >>> 0 > 3)
                  while (1) {
                    h = f[a >> 2] ^ e;
                    if ((((h & -2139062144) ^ -2139062144) & (h + -16843009)) | 0) break c;
                    a = (a + 4) | 0;
                    d = (d + -4) | 0;
                    if (d >>> 0 <= 3) {
                      i = 11;
                      break;
                    }
                  }
                else i = 11;
              } while (0);
              if ((i | 0) == 11)
                if (!d) {
                  i = 16;
                  break;
                }
              while (1) {
                if ((b[a >> 0] | 0) == (g << 24) >> 24) break b;
                d = (d + -1) | 0;
                if (!d) {
                  i = 16;
                  break;
                } else a = (a + 1) | 0;
              }
            }
          } while (0);
          if ((i | 0) == 16) a = 0;
          return a | 0;
        }
        function dc(a, b, c, d, e) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          var f = 0,
            g = 0;
          g = t;
          t = (t + 256) | 0;
          f = g;
          if (((c | 0) > (d | 0)) & (((e & 73728) | 0) == 0)) {
            e = (c - d) | 0;
            Hc(f | 0, ((b << 24) >> 24) | 0, (e >>> 0 < 256 ? e : 256) | 0) | 0;
            if (e >>> 0 > 255) {
              b = (c - d) | 0;
              do {
                Xb(a, f, 256);
                e = (e + -256) | 0;
              } while (e >>> 0 > 255);
              e = b & 255;
            }
            Xb(a, f, e);
          }
          t = g;
          return;
        }
        function ec(a, b) {
          a = a | 0;
          b = b | 0;
          if (!a) a = 0;
          else a = jc(a, b, 0) | 0;
          return a | 0;
        }
        function fc(a, c, d, e, g, i) {
          a = a | 0;
          c = +c;
          d = d | 0;
          e = e | 0;
          g = g | 0;
          i = i | 0;
          var j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0,
            q = 0,
            r = 0,
            s = 0,
            u = 0,
            v = 0,
            w = 0,
            x = 0,
            y = 0,
            z = 0,
            A = 0,
            B = 0,
            C = 0,
            D = 0,
            E = 0,
            F = 0,
            G = 0;
          G = t;
          t = (t + 560) | 0;
          l = (G + 32) | 0;
          v = (G + 536) | 0;
          F = G;
          E = F;
          m = (G + 540) | 0;
          f[v >> 2] = 0;
          D = (m + 12) | 0;
          gc(c) | 0;
          j = ba() | 0;
          if ((j | 0) < 0) {
            c = -c;
            gc(c) | 0;
            C = 1;
            B = 4335;
            j = ba() | 0;
          } else {
            C = (((g & 2049) | 0) != 0) & 1;
            B = ((g & 2048) | 0) == 0 ? (((g & 1) | 0) == 0 ? 4336 : 4341) : 4338;
          }
          do {
            if ((0 == 0) & (((j & 2146435072) | 0) == 2146435072)) {
              F = ((i & 32) | 0) != 0;
              j = (C + 3) | 0;
              dc(a, 32, d, j, g & -65537);
              Xb(a, B, C);
              Xb(a, (c != c) | (0 != 0) ? (F ? 4362 : 4366) : F ? 4354 : 4358, 3);
              dc(a, 32, d, j, g ^ 8192);
            } else {
              q = +hc(c, v) * 2;
              j = q != 0;
              if (j) f[v >> 2] = (f[v >> 2] | 0) + -1;
              u = i | 32;
              if ((u | 0) == 97) {
                o = i & 32;
                r = (o | 0) == 0 ? B : (B + 9) | 0;
                p = C | 2;
                j = (12 - e) | 0;
                do {
                  if (!((e >>> 0 > 11) | ((j | 0) == 0))) {
                    c = 8;
                    do {
                      j = (j + -1) | 0;
                      c = c * 16;
                    } while ((j | 0) != 0);
                    if ((b[r >> 0] | 0) == 45) {
                      c = -(c + (-q - c));
                      break;
                    } else {
                      c = q + c - c;
                      break;
                    }
                  } else c = q;
                } while (0);
                k = f[v >> 2] | 0;
                j = (k | 0) < 0 ? (0 - k) | 0 : k;
                j = ac(j, (((j | 0) < 0) << 31) >> 31, D) | 0;
                if ((j | 0) == (D | 0)) {
                  j = (m + 11) | 0;
                  b[j >> 0] = 48;
                }
                b[(j + -1) >> 0] = ((31 ? k >> 31 : k) & 2) + 43;
                n = (j + -2) | 0;
                b[n >> 0] = i + 15;
                k = (e | 0) < 1;
                l = ((g & 8) | 0) == 0;
                m = F;
                do {
                  C = ~~c;
                  j = (m + 1) | 0;
                  b[m >> 0] = o | h[(480 + C) >> 0];
                  c = (c - +(C | 0)) * 16;
                  if (((j - E) | 0) == 1 ? !(l & (k & (c == 0))) : 0) {
                    b[j >> 0] = 46;
                    m = (m + 2) | 0;
                  } else m = j;
                } while (c != 0);
                if ((e | 0) != 0 ? ((-2 - E + m) | 0) < (e | 0) : 0) {
                  k = D;
                  l = n;
                  j = (e + 2 + k - l) | 0;
                } else {
                  k = D;
                  l = n;
                  j = (k - E - l + m) | 0;
                }
                D = (j + p) | 0;
                dc(a, 32, d, D, g);
                Xb(a, r, p);
                dc(a, 48, d, D, g ^ 65536);
                E = (m - E) | 0;
                Xb(a, F, E);
                F = (k - l) | 0;
                dc(a, 48, (j - (E + F)) | 0, 0, 0);
                Xb(a, n, F);
                dc(a, 32, d, D, g ^ 8192);
                j = D;
                break;
              }
              k = (e | 0) < 0 ? 6 : e;
              if (j) {
                j = ((f[v >> 2] | 0) + -28) | 0;
                f[v >> 2] = j;
                c = q * 268435456;
              } else {
                c = q;
                j = f[v >> 2] | 0;
              }
              A = (j | 0) < 0 ? l : (l + 288) | 0;
              l = A;
              do {
                y = ~~c >>> 0;
                f[l >> 2] = y;
                l = (l + 4) | 0;
                c = (c - +(y >>> 0)) * 1e9;
              } while (c != 0);
              y = A;
              if ((j | 0) > 0) {
                o = A;
                while (1) {
                  n = (j | 0) < 29 ? j : 29;
                  j = (l + -4) | 0;
                  if (j >>> 0 >= o >>> 0) {
                    m = 0;
                    do {
                      s = Ec(f[j >> 2] | 0, 0, n | 0) | 0;
                      s = yc(s | 0, ba() | 0, m | 0, 0) | 0;
                      w = ba() | 0;
                      m = Cc(s | 0, w | 0, 1e9, 0) | 0;
                      x = xc(m | 0, ba() | 0, 1e9, 0) | 0;
                      x = zc(s | 0, w | 0, x | 0, ba() | 0) | 0;
                      ba() | 0;
                      f[j >> 2] = x;
                      j = (j + -4) | 0;
                    } while (j >>> 0 >= o >>> 0);
                    if (m) {
                      x = (o + -4) | 0;
                      f[x >> 2] = m;
                      m = x;
                    } else m = o;
                  } else m = o;
                  a: do {
                    if (l >>> 0 > m >>> 0) {
                      j = l;
                      while (1) {
                        l = (j + -4) | 0;
                        if (f[l >> 2] | 0) {
                          l = j;
                          break a;
                        }
                        if (l >>> 0 > m >>> 0) j = l;
                        else break;
                      }
                    }
                  } while (0);
                  j = ((f[v >> 2] | 0) - n) | 0;
                  f[v >> 2] = j;
                  if ((j | 0) > 0) o = m;
                  else break;
                }
              } else m = A;
              if ((j | 0) < 0) {
                e = (((((k + 25) | 0) / 9) | 0) + 1) | 0;
                s = (u | 0) == 102;
                do {
                  r = (0 - j) | 0;
                  r = (r | 0) < 9 ? r : 9;
                  if (m >>> 0 < l >>> 0) {
                    n = ((1 << r) + -1) | 0;
                    o = r ? 1e9 >>> r : 1e9;
                    p = 0;
                    j = m;
                    do {
                      x = f[j >> 2] | 0;
                      f[j >> 2] = (r ? x >>> r : x) + p;
                      p = U(x & n, o) | 0;
                      j = (j + 4) | 0;
                    } while (j >>> 0 < l >>> 0);
                    m = (f[m >> 2] | 0) == 0 ? (m + 4) | 0 : m;
                    if (p) {
                      f[l >> 2] = p;
                      l = (l + 4) | 0;
                    }
                  } else m = (f[m >> 2] | 0) == 0 ? (m + 4) | 0 : m;
                  j = s ? A : m;
                  x = (l - j) | 0;
                  l = ((2 ? x >> 2 : x) | 0) > (e | 0) ? (j + (e << 2)) | 0 : l;
                  j = ((f[v >> 2] | 0) + r) | 0;
                  f[v >> 2] = j;
                } while ((j | 0) < 0);
                s = m;
              } else s = m;
              if (s >>> 0 < l >>> 0) {
                j = (y - s) | 0;
                j = ((2 ? j >> 2 : j) * 9) | 0;
                n = f[s >> 2] | 0;
                if (n >>> 0 >= 10) {
                  m = 10;
                  do {
                    m = (m * 10) | 0;
                    j = (j + 1) | 0;
                  } while (n >>> 0 >= m >>> 0);
                }
              } else j = 0;
              w = (u | 0) == 103;
              x = (k | 0) != 0;
              m = (k - ((u | 0) == 102 ? 0 : j) + (((x & w) << 31) >> 31)) | 0;
              v = (l - y) | 0;
              if ((m | 0) < (((((2 ? v >> 2 : v) * 9) | 0) + -9) | 0)) {
                v = (m + 9216) | 0;
                m = ((v | 0) / 9) | 0;
                e = (A + 4 + ((m + -1024) << 2)) | 0;
                m = (v - ((m * 9) | 0)) | 0;
                if ((m | 0) < 8) {
                  n = 10;
                  while (1) {
                    n = (n * 10) | 0;
                    if ((m | 0) < 7) m = (m + 1) | 0;
                    else break;
                  }
                } else n = 10;
                p = f[e >> 2] | 0;
                m = ((p >>> 0) / (n >>> 0)) | 0;
                r = (p - (U(m, n) | 0)) | 0;
                o = ((e + 4) | 0) == (l | 0);
                if (!(o & ((r | 0) == 0))) {
                  q = ((m & 1) | 0) == 0 ? 9007199254740992 : 9007199254740994;
                  v = 1 ? n >>> 1 : n;
                  c = r >>> 0 < v >>> 0 ? 0.5 : o & ((r | 0) == (v | 0)) ? 1 : 1.5;
                  if (C) {
                    v = (b[B >> 0] | 0) == 45;
                    c = v ? -c : c;
                    q = v ? -q : q;
                  }
                  m = (p - r) | 0;
                  f[e >> 2] = m;
                  if (q + c != q) {
                    v = (m + n) | 0;
                    f[e >> 2] = v;
                    if (v >>> 0 > 999999999) {
                      n = e;
                      j = s;
                      while (1) {
                        m = (n + -4) | 0;
                        f[n >> 2] = 0;
                        if (m >>> 0 < j >>> 0) {
                          j = (j + -4) | 0;
                          f[j >> 2] = 0;
                        }
                        v = ((f[m >> 2] | 0) + 1) | 0;
                        f[m >> 2] = v;
                        if (v >>> 0 > 999999999) n = m;
                        else {
                          n = j;
                          break;
                        }
                      }
                    } else {
                      m = e;
                      n = s;
                    }
                    j = (y - n) | 0;
                    j = ((2 ? j >> 2 : j) * 9) | 0;
                    p = f[n >> 2] | 0;
                    if (p >>> 0 >= 10) {
                      o = 10;
                      do {
                        o = (o * 10) | 0;
                        j = (j + 1) | 0;
                      } while (p >>> 0 >= o >>> 0);
                    }
                  } else {
                    m = e;
                    n = s;
                  }
                } else {
                  m = e;
                  n = s;
                }
                v = (m + 4) | 0;
                l = l >>> 0 > v >>> 0 ? v : l;
              } else n = s;
              e = (0 - j) | 0;
              b: do {
                if (l >>> 0 > n >>> 0)
                  while (1) {
                    m = (l + -4) | 0;
                    if (f[m >> 2] | 0) {
                      v = l;
                      u = 1;
                      break b;
                    }
                    if (m >>> 0 > n >>> 0) l = m;
                    else {
                      v = m;
                      u = 0;
                      break;
                    }
                  }
                else {
                  v = l;
                  u = 0;
                }
              } while (0);
              do {
                if (w) {
                  k = (k + ((x ^ 1) & 1)) | 0;
                  if (((k | 0) > (j | 0)) & ((j | 0) > -5)) {
                    o = (i + -1) | 0;
                    k = (k + -1 - j) | 0;
                  } else {
                    o = (i + -2) | 0;
                    k = (k + -1) | 0;
                  }
                  if (!(g & 8)) {
                    if (u ? ((z = f[(v + -4) >> 2] | 0), (z | 0) != 0) : 0)
                      if (!((z >>> 0) % 10 | 0)) {
                        m = 0;
                        l = 10;
                        do {
                          l = (l * 10) | 0;
                          m = (m + 1) | 0;
                        } while (!((z >>> 0) % (l >>> 0) | 0 | 0));
                      } else m = 0;
                    else m = 9;
                    l = (v - y) | 0;
                    l = ((((2 ? l >> 2 : l) * 9) | 0) + -9) | 0;
                    if ((o | 32 | 0) == 102) {
                      i = (l - m) | 0;
                      i = (i | 0) > 0 ? i : 0;
                      k = (k | 0) < (i | 0) ? k : i;
                      break;
                    } else {
                      i = (l + j - m) | 0;
                      i = (i | 0) > 0 ? i : 0;
                      k = (k | 0) < (i | 0) ? k : i;
                      break;
                    }
                  }
                } else o = i;
              } while (0);
              s = (k | 0) != 0;
              p = s ? 1 : (3 ? g >>> 3 : g) & 1;
              r = (o | 32 | 0) == 102;
              if (r) {
                w = 0;
                j = (j | 0) > 0 ? j : 0;
              } else {
                l = (j | 0) < 0 ? e : j;
                l = ac(l, (((l | 0) < 0) << 31) >> 31, D) | 0;
                m = D;
                if (((m - l) | 0) < 2)
                  do {
                    l = (l + -1) | 0;
                    b[l >> 0] = 48;
                  } while (((m - l) | 0) < 2);
                b[(l + -1) >> 0] = ((31 ? j >> 31 : j) & 2) + 43;
                j = (l + -2) | 0;
                b[j >> 0] = o;
                w = j;
                j = (m - j) | 0;
              }
              j = (C + 1 + k + p + j) | 0;
              dc(a, 32, d, j, g);
              Xb(a, B, C);
              dc(a, 48, d, j, g ^ 65536);
              if (r) {
                p = n >>> 0 > A >>> 0 ? A : n;
                r = (F + 9) | 0;
                n = r;
                o = (F + 8) | 0;
                m = p;
                do {
                  l = ac(f[m >> 2] | 0, 0, r) | 0;
                  if ((m | 0) == (p | 0)) {
                    if ((l | 0) == (r | 0)) {
                      b[o >> 0] = 48;
                      l = o;
                    }
                  } else if (l >>> 0 > F >>> 0) {
                    Hc(F | 0, 48, (l - E) | 0) | 0;
                    do {
                      l = (l + -1) | 0;
                    } while (l >>> 0 > F >>> 0);
                  }
                  Xb(a, l, (n - l) | 0);
                  m = (m + 4) | 0;
                } while (m >>> 0 <= A >>> 0);
                if (!((((g & 8) | 0) == 0) & (s ^ 1))) Xb(a, 4370, 1);
                if ((m >>> 0 < v >>> 0) & ((k | 0) > 0))
                  while (1) {
                    l = ac(f[m >> 2] | 0, 0, r) | 0;
                    if (l >>> 0 > F >>> 0) {
                      Hc(F | 0, 48, (l - E) | 0) | 0;
                      do {
                        l = (l + -1) | 0;
                      } while (l >>> 0 > F >>> 0);
                    }
                    Xb(a, l, (k | 0) < 9 ? k : 9);
                    m = (m + 4) | 0;
                    l = (k + -9) | 0;
                    if (!((m >>> 0 < v >>> 0) & ((k | 0) > 9))) {
                      k = l;
                      break;
                    } else k = l;
                  }
                dc(a, 48, (k + 9) | 0, 9, 0);
              } else {
                v = u ? v : (n + 4) | 0;
                if ((n >>> 0 < v >>> 0) & ((k | 0) > -1)) {
                  e = (F + 9) | 0;
                  s = ((g & 8) | 0) == 0;
                  u = e;
                  p = (0 - E) | 0;
                  r = (F + 8) | 0;
                  o = n;
                  do {
                    l = ac(f[o >> 2] | 0, 0, e) | 0;
                    if ((l | 0) == (e | 0)) {
                      b[r >> 0] = 48;
                      l = r;
                    }
                    do {
                      if ((o | 0) == (n | 0)) {
                        m = (l + 1) | 0;
                        Xb(a, l, 1);
                        if (s & ((k | 0) < 1)) {
                          l = m;
                          break;
                        }
                        Xb(a, 4370, 1);
                        l = m;
                      } else {
                        if (l >>> 0 <= F >>> 0) break;
                        Hc(F | 0, 48, (l + p) | 0) | 0;
                        do {
                          l = (l + -1) | 0;
                        } while (l >>> 0 > F >>> 0);
                      }
                    } while (0);
                    E = (u - l) | 0;
                    Xb(a, l, (k | 0) > (E | 0) ? E : k);
                    k = (k - E) | 0;
                    o = (o + 4) | 0;
                  } while ((o >>> 0 < v >>> 0) & ((k | 0) > -1));
                }
                dc(a, 48, (k + 18) | 0, 18, 0);
                Xb(a, w, (D - w) | 0);
              }
              dc(a, 32, d, j, g ^ 8192);
            }
          } while (0);
          t = G;
          return ((j | 0) < (d | 0) ? d : j) | 0;
        }
        function gc(a) {
          a = +a;
          var b = 0;
          p[s >> 3] = a;
          b = f[s >> 2] | 0;
          aa(f[(s + 4) >> 2] | 0);
          return b | 0;
        }
        function hc(a, b) {
          a = +a;
          b = b | 0;
          return +(+ic(a, b));
        }
        function ic(a, b) {
          a = +a;
          b = b | 0;
          var c = 0,
            d = 0,
            e = 0;
          p[s >> 3] = a;
          c = f[s >> 2] | 0;
          d = f[(s + 4) >> 2] | 0;
          e = Dc(c | 0, d | 0, 52) | 0;
          ba() | 0;
          switch (e & 2047) {
            case 0: {
              if (a != 0) {
                a = +ic(a * 0x10000000000000000, b);
                c = ((f[b >> 2] | 0) + -64) | 0;
              } else c = 0;
              f[b >> 2] = c;
              break;
            }
            case 2047:
              break;
            default: {
              f[b >> 2] = (e & 2047) + -1022;
              f[s >> 2] = c;
              f[(s + 4) >> 2] = (d & -2146435073) | 1071644672;
              a = +p[s >> 3];
            }
          }
          return +a;
        }
        function jc(a, c, d) {
          a = a | 0;
          c = c | 0;
          d = d | 0;
          do {
            if (a) {
              if (c >>> 0 < 128) {
                b[a >> 0] = c;
                a = 1;
                break;
              }
              d = ((kc() | 0) + 188) | 0;
              if (!(f[f[d >> 2] >> 2] | 0))
                if (((c & -128) | 0) == 57216) {
                  b[a >> 0] = c;
                  a = 1;
                  break;
                } else {
                  a = Mb() | 0;
                  f[a >> 2] = 84;
                  a = -1;
                  break;
                }
              if (c >>> 0 < 2048) {
                b[a >> 0] = (6 ? c >>> 6 : c) | 192;
                b[(a + 1) >> 0] = (c & 63) | 128;
                a = 2;
                break;
              }
              if ((c >>> 0 < 55296) | (((c & -8192) | 0) == 57344)) {
                b[a >> 0] = (12 ? c >>> 12 : c) | 224;
                b[(a + 1) >> 0] = ((6 ? c >>> 6 : c) & 63) | 128;
                b[(a + 2) >> 0] = (c & 63) | 128;
                a = 3;
                break;
              }
              if (((c + -65536) | 0) >>> 0 < 1048576) {
                b[a >> 0] = (18 ? c >>> 18 : c) | 240;
                b[(a + 1) >> 0] = ((12 ? c >>> 12 : c) & 63) | 128;
                b[(a + 2) >> 0] = ((6 ? c >>> 6 : c) & 63) | 128;
                b[(a + 3) >> 0] = (c & 63) | 128;
                a = 4;
                break;
              } else {
                a = Mb() | 0;
                f[a >> 2] = 84;
                a = -1;
                break;
              }
            } else a = 1;
          } while (0);
          return a | 0;
        }
        function kc() {
          return lc() | 0;
        }
        function lc() {
          return 2652;
        }
        function mc() {
          return lc() | 0;
        }
        function nc(a, c) {
          a = a | 0;
          c = c | 0;
          var d = 0,
            e = 0;
          d = 0;
          while (1) {
            if ((h[(496 + d) >> 0] | 0) == (a | 0)) {
              e = 4;
              break;
            }
            d = (d + 1) | 0;
            if ((d | 0) == 87) {
              a = 87;
              e = 5;
              break;
            }
          }
          if ((e | 0) == 4)
            if (!d) d = 592;
            else {
              a = d;
              e = 5;
            }
          if ((e | 0) == 5) {
            d = 592;
            do {
              do {
                e = d;
                d = (d + 1) | 0;
              } while ((b[e >> 0] | 0) != 0);
              a = (a + -1) | 0;
            } while ((a | 0) != 0);
          }
          return oc(d, f[(c + 20) >> 2] | 0) | 0;
        }
        function oc(a, b) {
          a = a | 0;
          b = b | 0;
          return pc(a, b) | 0;
        }
        function pc(a, b) {
          a = a | 0;
          b = b | 0;
          if (!b) b = 0;
          else b = qc(f[b >> 2] | 0, f[(b + 4) >> 2] | 0, a) | 0;
          return ((b | 0) == 0 ? a : b) | 0;
        }
        function qc(a, c, d) {
          a = a | 0;
          c = c | 0;
          d = d | 0;
          var e = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0;
          o = ((f[a >> 2] | 0) + 1794895138) | 0;
          h = rc(f[(a + 8) >> 2] | 0, o) | 0;
          e = rc(f[(a + 12) >> 2] | 0, o) | 0;
          g = rc(f[(a + 16) >> 2] | 0, o) | 0;
          a: do {
            if ((h >>> 0 < (2 ? c >>> 2 : c) >>> 0 ? ((n = (c - (h << 2)) | 0), (e >>> 0 < n >>> 0) & (g >>> 0 < n >>> 0)) : 0) ? (((g | e) & 3) | 0) == 0 : 0) {
              n = 2 ? e >>> 2 : e;
              m = 2 ? g >>> 2 : g;
              l = 0;
              while (1) {
                j = 1 ? h >>> 1 : h;
                k = (l + j) | 0;
                i = k << 1;
                g = (i + n) | 0;
                e = rc(f[(a + (g << 2)) >> 2] | 0, o) | 0;
                g = rc(f[(a + ((g + 1) << 2)) >> 2] | 0, o) | 0;
                if (!((g >>> 0 < c >>> 0) & (e >>> 0 < ((c - g) | 0) >>> 0))) {
                  e = 0;
                  break a;
                }
                if (b[(a + (g + e)) >> 0] | 0) {
                  e = 0;
                  break a;
                }
                e = Pb(d, (a + g) | 0) | 0;
                if (!e) break;
                e = (e | 0) < 0;
                if ((h | 0) == 1) {
                  e = 0;
                  break a;
                }
                l = e ? l : k;
                h = e ? j : (h - j) | 0;
              }
              e = (i + m) | 0;
              g = rc(f[(a + (e << 2)) >> 2] | 0, o) | 0;
              e = rc(f[(a + ((e + 1) << 2)) >> 2] | 0, o) | 0;
              if ((e >>> 0 < c >>> 0) & (g >>> 0 < ((c - e) | 0) >>> 0)) e = (b[(a + (e + g)) >> 0] | 0) == 0 ? (a + e) | 0 : 0;
              else e = 0;
            } else e = 0;
          } while (0);
          return e | 0;
        }
        function rc(a, b) {
          a = a | 0;
          b = b | 0;
          var c = 0;
          c = Fc(a | 0) | 0;
          return ((b | 0) == 0 ? a : c) | 0;
        }
        function sc(a, c, d) {
          a = a | 0;
          c = c | 0;
          d = d | 0;
          var e = 0,
            g = 0,
            h = 0,
            i = 0,
            j = 0;
          e = (d + 16) | 0;
          g = f[e >> 2] | 0;
          if (!g)
            if (!(tc(d) | 0)) {
              g = f[e >> 2] | 0;
              h = 5;
            } else e = 0;
          else h = 5;
          a: do {
            if ((h | 0) == 5) {
              j = (d + 20) | 0;
              i = f[j >> 2] | 0;
              e = i;
              if (((g - i) | 0) >>> 0 < c >>> 0) {
                e = na[f[(d + 36) >> 2] & 7](d, a, c) | 0;
                break;
              }
              b: do {
                if (((b[(d + 75) >> 0] | 0) < 0) | ((c | 0) == 0)) {
                  h = 0;
                  g = a;
                } else {
                  i = c;
                  while (1) {
                    g = (i + -1) | 0;
                    if ((b[(a + g) >> 0] | 0) == 10) break;
                    if (!g) {
                      h = 0;
                      g = a;
                      break b;
                    } else i = g;
                  }
                  e = na[f[(d + 36) >> 2] & 7](d, a, i) | 0;
                  if (e >>> 0 < i >>> 0) break a;
                  h = i;
                  g = (a + i) | 0;
                  c = (c - i) | 0;
                  e = f[j >> 2] | 0;
                }
              } while (0);
              Gc(e | 0, g | 0, c | 0) | 0;
              f[j >> 2] = (f[j >> 2] | 0) + c;
              e = (h + c) | 0;
            }
          } while (0);
          return e | 0;
        }
        function tc(a) {
          a = a | 0;
          var c = 0,
            d = 0;
          c = (a + 74) | 0;
          d = b[c >> 0] | 0;
          b[c >> 0] = (d + 255) | d;
          c = f[a >> 2] | 0;
          if (!(c & 8)) {
            f[(a + 8) >> 2] = 0;
            f[(a + 4) >> 2] = 0;
            d = f[(a + 44) >> 2] | 0;
            f[(a + 28) >> 2] = d;
            f[(a + 20) >> 2] = d;
            f[(a + 16) >> 2] = d + (f[(a + 48) >> 2] | 0);
            a = 0;
          } else {
            f[a >> 2] = c | 32;
            a = -1;
          }
          return a | 0;
        }
        function uc(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          var d = 0,
            e = 0;
          d = (a + 20) | 0;
          e = f[d >> 2] | 0;
          a = ((f[(a + 16) >> 2] | 0) - e) | 0;
          a = a >>> 0 > c >>> 0 ? c : a;
          Gc(e | 0, b | 0, a | 0) | 0;
          f[d >> 2] = (f[d >> 2] | 0) + a;
          return c | 0;
        }
        function vc(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          var d = 0,
            e = 0;
          d = t;
          t = (t + 16) | 0;
          e = d;
          f[e >> 2] = c;
          c = Tb(a, b, e) | 0;
          t = d;
          return c | 0;
        }
        function wc(a, b) {
          a = a | 0;
          b = b | 0;
          var c = 0,
            d = 0,
            e = 0,
            f = 0;
          f = a & 65535;
          e = b & 65535;
          c = U(e, f) | 0;
          d = a >>> 16;
          a = ((c >>> 16) + (U(e, d) | 0)) | 0;
          e = b >>> 16;
          b = U(e, f) | 0;
          return (aa(((a >>> 16) + (U(e, d) | 0) + ((((a & 65535) + b) | 0) >>> 16)) | 0), ((a + b) << 16) | (c & 65535) | 0) | 0;
        }
        function xc(a, b, c, d) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          var e = 0,
            f = 0;
          e = a;
          f = c;
          c = wc(e, f) | 0;
          a = ba() | 0;
          return (aa(((U(b, f) | 0) + (U(d, e) | 0) + a) | (a & 0) | 0), c | 0 | 0) | 0;
        }
        function yc(a, b, c, d) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          c = (a + c) >>> 0;
          return (aa(((b + d + ((c >>> 0 < a >>> 0) | 0)) >>> 0) | 0), c | 0) | 0;
        }
        function zc(a, b, c, d) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          d = (b - d - ((c >>> 0 > a >>> 0) | 0)) >>> 0;
          return (aa(d | 0), ((a - c) >>> 0) | 0) | 0;
        }
        function Ac(a) {
          a = a | 0;
          return (a ? (31 - (X(a ^ (a - 1)) | 0)) | 0 : 32) | 0;
        }
        function Bc(a, b, c, d, e) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          var g = 0,
            h = 0,
            i = 0,
            j = 0,
            k = 0,
            l = 0,
            m = 0,
            n = 0,
            o = 0,
            p = 0;
          l = a;
          j = b;
          k = j;
          h = c;
          n = d;
          i = n;
          if (!k) {
            g = (e | 0) != 0;
            if (!i) {
              if (g) {
                f[e >> 2] = (l >>> 0) % (h >>> 0);
                f[(e + 4) >> 2] = 0;
              }
              n = 0;
              e = ((l >>> 0) / (h >>> 0)) >>> 0;
              return (aa(n | 0), e) | 0;
            } else {
              if (!g) {
                n = 0;
                e = 0;
                return (aa(n | 0), e) | 0;
              }
              f[e >> 2] = a | 0;
              f[(e + 4) >> 2] = b & 0;
              n = 0;
              e = 0;
              return (aa(n | 0), e) | 0;
            }
          }
          g = (i | 0) == 0;
          do {
            if (h) {
              if (!g) {
                g = ((X(i | 0) | 0) - (X(k | 0) | 0)) | 0;
                if (g >>> 0 <= 31) {
                  m = (g + 1) | 0;
                  i = (31 - g) | 0;
                  b = (g - 31) >> 31;
                  h = m;
                  a = ((l >>> (m >>> 0)) & b) | (k << i);
                  b = (k >>> (m >>> 0)) & b;
                  g = 0;
                  i = l << i;
                  break;
                }
                if (!e) {
                  n = 0;
                  e = 0;
                  return (aa(n | 0), e) | 0;
                }
                f[e >> 2] = a | 0;
                f[(e + 4) >> 2] = j | (b & 0);
                n = 0;
                e = 0;
                return (aa(n | 0), e) | 0;
              }
              g = (h - 1) | 0;
              if ((g & h) | 0) {
                i = ((X(h | 0) | 0) + 33 - (X(k | 0) | 0)) | 0;
                p = (64 - i) | 0;
                m = (32 - i) | 0;
                j = m >> 31;
                o = (i - 32) | 0;
                b = o >> 31;
                h = i;
                a = (((m - 1) >> 31) & (k >>> (o >>> 0))) | (((k << m) | (l >>> (i >>> 0))) & b);
                b = b & (k >>> (i >>> 0));
                g = (l << p) & j;
                i = (((k << p) | (l >>> (o >>> 0))) & j) | ((l << m) & ((i - 33) >> 31));
                break;
              }
              if (e | 0) {
                f[e >> 2] = g & l;
                f[(e + 4) >> 2] = 0;
              }
              if ((h | 0) == 1) {
                o = j | (b & 0);
                p = a | 0 | 0;
                return (aa(o | 0), p) | 0;
              } else {
                p = Ac(h | 0) | 0;
                o = (k >>> (p >>> 0)) | 0;
                p = (k << (32 - p)) | (l >>> (p >>> 0)) | 0;
                return (aa(o | 0), p) | 0;
              }
            } else {
              if (g) {
                if (e | 0) {
                  f[e >> 2] = (k >>> 0) % (h >>> 0);
                  f[(e + 4) >> 2] = 0;
                }
                o = 0;
                p = ((k >>> 0) / (h >>> 0)) >>> 0;
                return (aa(o | 0), p) | 0;
              }
              if (!l) {
                if (e | 0) {
                  f[e >> 2] = 0;
                  f[(e + 4) >> 2] = (k >>> 0) % (i >>> 0);
                }
                o = 0;
                p = ((k >>> 0) / (i >>> 0)) >>> 0;
                return (aa(o | 0), p) | 0;
              }
              g = (i - 1) | 0;
              if (!(g & i)) {
                if (e | 0) {
                  f[e >> 2] = a | 0;
                  f[(e + 4) >> 2] = (g & k) | (b & 0);
                }
                o = 0;
                p = k >>> ((Ac(i | 0) | 0) >>> 0);
                return (aa(o | 0), p) | 0;
              }
              g = ((X(i | 0) | 0) - (X(k | 0) | 0)) | 0;
              if (g >>> 0 <= 30) {
                b = (g + 1) | 0;
                i = (31 - g) | 0;
                h = b;
                a = (k << i) | (l >>> (b >>> 0));
                b = k >>> (b >>> 0);
                g = 0;
                i = l << i;
                break;
              }
              if (!e) {
                o = 0;
                p = 0;
                return (aa(o | 0), p) | 0;
              }
              f[e >> 2] = a | 0;
              f[(e + 4) >> 2] = j | (b & 0);
              o = 0;
              p = 0;
              return (aa(o | 0), p) | 0;
            }
          } while (0);
          if (!h) {
            k = i;
            j = 0;
            i = 0;
          } else {
            m = c | 0 | 0;
            l = n | (d & 0);
            k = yc(m | 0, l | 0, -1, -1) | 0;
            c = ba() | 0;
            j = i;
            i = 0;
            do {
              d = j;
              j = (g >>> 31) | (j << 1);
              g = i | (g << 1);
              d = (a << 1) | (d >>> 31) | 0;
              n = (a >>> 31) | (b << 1) | 0;
              zc(k | 0, c | 0, d | 0, n | 0) | 0;
              p = ba() | 0;
              o = (p >> 31) | (((p | 0) < 0 ? -1 : 0) << 1);
              i = o & 1;
              a = zc(d | 0, n | 0, (o & m) | 0, (((((p | 0) < 0 ? -1 : 0) >> 31) | (((p | 0) < 0 ? -1 : 0) << 1)) & l) | 0) | 0;
              b = ba() | 0;
              h = (h - 1) | 0;
            } while ((h | 0) != 0);
            k = j;
            j = 0;
          }
          h = 0;
          if (e | 0) {
            f[e >> 2] = a;
            f[(e + 4) >> 2] = b;
          }
          o = ((g | 0) >>> 31) | ((k | h) << 1) | (((h << 1) | (g >>> 31)) & 0) | j;
          p = (((g << 1) | (0 >>> 31)) & -2) | i;
          return (aa(o | 0), p) | 0;
        }
        function Cc(a, b, c, d) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          return Bc(a, b, c, d, 0) | 0;
        }
        function Dc(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          if ((c | 0) < 32) {
            aa((b >>> c) | 0);
            return (a >>> c) | ((b & ((1 << c) - 1)) << (32 - c));
          }
          aa(0);
          return (b >>> (c - 32)) | 0;
        }
        function Ec(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          if ((c | 0) < 32) {
            aa((b << c) | ((a & (((1 << c) - 1) << (32 - c))) >>> (32 - c)) | 0);
            return a << c;
          }
          aa((a << (c - 32)) | 0);
          return 0;
        }
        function Fc(a) {
          a = a | 0;
          return ((a & 255) << 24) | (((a >> 8) & 255) << 16) | (((a >> 16) & 255) << 8) | (a >>> 24) | 0;
        }
        function Gc(a, c, d) {
          a = a | 0;
          c = c | 0;
          d = d | 0;
          var e = 0,
            g = 0,
            h = 0;
          if ((d | 0) >= 8192) return ia(a | 0, c | 0, d | 0) | 0;
          h = a | 0;
          g = (a + d) | 0;
          if ((a & 3) == (c & 3)) {
            while (a & 3) {
              if (!d) return h | 0;
              b[a >> 0] = b[c >> 0] | 0;
              a = (a + 1) | 0;
              c = (c + 1) | 0;
              d = (d - 1) | 0;
            }
            d = (g & -4) | 0;
            e = (d - 64) | 0;
            while ((a | 0) <= (e | 0)) {
              f[a >> 2] = f[c >> 2];
              f[(a + 4) >> 2] = f[(c + 4) >> 2];
              f[(a + 8) >> 2] = f[(c + 8) >> 2];
              f[(a + 12) >> 2] = f[(c + 12) >> 2];
              f[(a + 16) >> 2] = f[(c + 16) >> 2];
              f[(a + 20) >> 2] = f[(c + 20) >> 2];
              f[(a + 24) >> 2] = f[(c + 24) >> 2];
              f[(a + 28) >> 2] = f[(c + 28) >> 2];
              f[(a + 32) >> 2] = f[(c + 32) >> 2];
              f[(a + 36) >> 2] = f[(c + 36) >> 2];
              f[(a + 40) >> 2] = f[(c + 40) >> 2];
              f[(a + 44) >> 2] = f[(c + 44) >> 2];
              f[(a + 48) >> 2] = f[(c + 48) >> 2];
              f[(a + 52) >> 2] = f[(c + 52) >> 2];
              f[(a + 56) >> 2] = f[(c + 56) >> 2];
              f[(a + 60) >> 2] = f[(c + 60) >> 2];
              a = (a + 64) | 0;
              c = (c + 64) | 0;
            }
            while ((a | 0) < (d | 0)) {
              f[a >> 2] = f[c >> 2];
              a = (a + 4) | 0;
              c = (c + 4) | 0;
            }
          } else {
            d = (g - 4) | 0;
            while ((a | 0) < (d | 0)) {
              b[a >> 0] = b[c >> 0] | 0;
              b[(a + 1) >> 0] = b[(c + 1) >> 0] | 0;
              b[(a + 2) >> 0] = b[(c + 2) >> 0] | 0;
              b[(a + 3) >> 0] = b[(c + 3) >> 0] | 0;
              a = (a + 4) | 0;
              c = (c + 4) | 0;
            }
          }
          while ((a | 0) < (g | 0)) {
            b[a >> 0] = b[c >> 0] | 0;
            a = (a + 1) | 0;
            c = (c + 1) | 0;
          }
          return h | 0;
        }
        function Hc(a, c, d) {
          a = a | 0;
          c = c | 0;
          d = d | 0;
          var e = 0,
            g = 0,
            h = 0,
            i = 0;
          h = (a + d) | 0;
          c = c & 255;
          if ((d | 0) >= 67) {
            while (a & 3) {
              b[a >> 0] = c;
              a = (a + 1) | 0;
            }
            e = (h & -4) | 0;
            g = (e - 64) | 0;
            i = c | (c << 8) | (c << 16) | (c << 24);
            while ((a | 0) <= (g | 0)) {
              f[a >> 2] = i;
              f[(a + 4) >> 2] = i;
              f[(a + 8) >> 2] = i;
              f[(a + 12) >> 2] = i;
              f[(a + 16) >> 2] = i;
              f[(a + 20) >> 2] = i;
              f[(a + 24) >> 2] = i;
              f[(a + 28) >> 2] = i;
              f[(a + 32) >> 2] = i;
              f[(a + 36) >> 2] = i;
              f[(a + 40) >> 2] = i;
              f[(a + 44) >> 2] = i;
              f[(a + 48) >> 2] = i;
              f[(a + 52) >> 2] = i;
              f[(a + 56) >> 2] = i;
              f[(a + 60) >> 2] = i;
              a = (a + 64) | 0;
            }
            while ((a | 0) < (e | 0)) {
              f[a >> 2] = i;
              a = (a + 4) | 0;
            }
          }
          while ((a | 0) < (h | 0)) {
            b[a >> 0] = c;
            a = (a + 1) | 0;
          }
          return (h - d) | 0;
        }
        function Ic(a) {
          a = a | 0;
          var b = 0,
            c = 0;
          c = f[r >> 2] | 0;
          b = (c + a) | 0;
          if ((((a | 0) > 0) & ((b | 0) < (c | 0))) | ((b | 0) < 0)) {
            ca() | 0;
            da(12);
            return -1;
          }
          f[r >> 2] = b;
          if ((b | 0) > ($() | 0) ? (_() | 0) == 0 : 0) {
            f[r >> 2] = c;
            da(12);
            return -1;
          }
          return c | 0;
        }
        function Jc(a, b) {
          a = a | 0;
          b = b | 0;
          return ma[a & 1](b | 0) | 0;
        }
        function Kc(a, b, c, d) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          return na[a & 7](b | 0, c | 0, d | 0) | 0;
        }
        function Lc(a, b) {
          a = a | 0;
          b = b | 0;
          oa[a & 0](b | 0);
        }
        function Mc(a, b, c, d) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          pa[a & 3](b | 0, c | 0, d | 0);
        }
        function Nc(a, b, c, d, e) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          e = e | 0;
          qa[a & 3](b | 0, c | 0, d | 0, e | 0);
        }
        function Oc(a) {
          a = a | 0;
          Y(0);
          return 0;
        }
        function Pc(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          Y(1);
          return 0;
        }
        function Qc(a) {
          a = a | 0;
          Y(2);
        }
        function Rc(a, b, c) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          Y(3);
        }
        function Sc(a, b, c, d) {
          a = a | 0;
          b = b | 0;
          c = c | 0;
          d = d | 0;
          Y(4);
        }
        var ma = [Oc, Ib];
        var na = [Pc, Ob, Kb, uc, Jb, Pc, Pc, Pc];
        var oa = [Qc];
        var pa = [Rc, qb, rb, Rc];
        var qa = [Sc, ob, pb, Sc];
        return { ___errno_location: Mb, ___muldi3: xc, ___udivdi3: Cc, _bitshift64Lshr: Dc, _bitshift64Shl: Ec, _csmFree: Cb, _csmGetDrawableConstantFlags: Ta, _csmGetDrawableCount: Ra, _csmGetDrawableDrawOrders: Wa, _csmGetDrawableDynamicFlags: Ua, _csmGetDrawableIds: Sa, _csmGetDrawableIndexCounts: cb, _csmGetDrawableIndices: db, _csmGetDrawableMaskCounts: Za, _csmGetDrawableMasks: _a, _csmGetDrawableOpacities: Ya, _csmGetDrawableRenderOrders: Xa, _csmGetDrawableTextureIndices: Va, _csmGetDrawableVertexCounts: $a, _csmGetDrawableVertexPositions: ab, _csmGetDrawableVertexUvs: bb, _csmGetParameterCount: Ha, _csmGetParameterDefaultValues: La, _csmGetParameterIds: Ia, _csmGetParameterMaximumValues: Ka, _csmGetParameterMinimumValues: Ja, _csmGetParameterValues: Ma, _csmGetPartCount: Na, _csmGetPartIds: Oa, _csmGetPartOpacities: Pa, _csmGetPartParentPartIndices: Qa, _csmGetSizeofModel: Ea, _csmInitializeModelInPlace: Fa, _csmMalloc: Bb, _csmMallocMoc: zb, _csmMallocModelAndInitialize: Ab, _csmReadCanvasInfo: Da, _csmResetDrawableDynamicFlags: eb, _csmReviveMocInPlace: Ca, _csmUpdateModel: Ga, _emscripten_replace_memory: la, _free: Eb, _i64Add: yc, _i64Subtract: zc, _llvm_bswap_i32: Fc, _malloc: Db, _memcpy: Gc, _memset: Hc, _sbrk: Ic, dynCall_ii: Jc, dynCall_iiii: Kc, dynCall_vi: Lc, dynCall_viii: Mc, dynCall_viiii: Nc, establishStackSpace: ua, setThrew: va, stackAlloc: ra, stackRestore: ta, stackSave: sa };
      })(Module.asmGlobalArg, Module.asmLibraryArg, buffer);
      var ___errno_location = (Module["___errno_location"] = asm["___errno_location"]);
      var ___muldi3 = (Module["___muldi3"] = asm["___muldi3"]);
      var ___udivdi3 = (Module["___udivdi3"] = asm["___udivdi3"]);
      var _bitshift64Lshr = (Module["_bitshift64Lshr"] = asm["_bitshift64Lshr"]);
      var _bitshift64Shl = (Module["_bitshift64Shl"] = asm["_bitshift64Shl"]);
      var _csmFree = (Module["_csmFree"] = asm["_csmFree"]);
      var _csmGetDrawableConstantFlags = (Module["_csmGetDrawableConstantFlags"] = asm["_csmGetDrawableConstantFlags"]);
      var _csmGetDrawableCount = (Module["_csmGetDrawableCount"] = asm["_csmGetDrawableCount"]);
      var _csmGetDrawableDrawOrders = (Module["_csmGetDrawableDrawOrders"] = asm["_csmGetDrawableDrawOrders"]);
      var _csmGetDrawableDynamicFlags = (Module["_csmGetDrawableDynamicFlags"] = asm["_csmGetDrawableDynamicFlags"]);
      var _csmGetDrawableIds = (Module["_csmGetDrawableIds"] = asm["_csmGetDrawableIds"]);
      var _csmGetDrawableIndexCounts = (Module["_csmGetDrawableIndexCounts"] = asm["_csmGetDrawableIndexCounts"]);
      var _csmGetDrawableIndices = (Module["_csmGetDrawableIndices"] = asm["_csmGetDrawableIndices"]);
      var _csmGetDrawableMaskCounts = (Module["_csmGetDrawableMaskCounts"] = asm["_csmGetDrawableMaskCounts"]);
      var _csmGetDrawableMasks = (Module["_csmGetDrawableMasks"] = asm["_csmGetDrawableMasks"]);
      var _csmGetDrawableOpacities = (Module["_csmGetDrawableOpacities"] = asm["_csmGetDrawableOpacities"]);
      var _csmGetDrawableRenderOrders = (Module["_csmGetDrawableRenderOrders"] = asm["_csmGetDrawableRenderOrders"]);
      var _csmGetDrawableTextureIndices = (Module["_csmGetDrawableTextureIndices"] = asm["_csmGetDrawableTextureIndices"]);
      var _csmGetDrawableVertexCounts = (Module["_csmGetDrawableVertexCounts"] = asm["_csmGetDrawableVertexCounts"]);
      var _csmGetDrawableVertexPositions = (Module["_csmGetDrawableVertexPositions"] = asm["_csmGetDrawableVertexPositions"]);
      var _csmGetDrawableVertexUvs = (Module["_csmGetDrawableVertexUvs"] = asm["_csmGetDrawableVertexUvs"]);
      var _csmGetParameterCount = (Module["_csmGetParameterCount"] = asm["_csmGetParameterCount"]);
      var _csmGetParameterDefaultValues = (Module["_csmGetParameterDefaultValues"] = asm["_csmGetParameterDefaultValues"]);
      var _csmGetParameterIds = (Module["_csmGetParameterIds"] = asm["_csmGetParameterIds"]);
      var _csmGetParameterMaximumValues = (Module["_csmGetParameterMaximumValues"] = asm["_csmGetParameterMaximumValues"]);
      var _csmGetParameterMinimumValues = (Module["_csmGetParameterMinimumValues"] = asm["_csmGetParameterMinimumValues"]);
      var _csmGetParameterValues = (Module["_csmGetParameterValues"] = asm["_csmGetParameterValues"]);
      var _csmGetPartCount = (Module["_csmGetPartCount"] = asm["_csmGetPartCount"]);
      var _csmGetPartIds = (Module["_csmGetPartIds"] = asm["_csmGetPartIds"]);
      var _csmGetPartOpacities = (Module["_csmGetPartOpacities"] = asm["_csmGetPartOpacities"]);
      var _csmGetPartParentPartIndices = (Module["_csmGetPartParentPartIndices"] = asm["_csmGetPartParentPartIndices"]);
      var _csmGetSizeofModel = (Module["_csmGetSizeofModel"] = asm["_csmGetSizeofModel"]);
      var _csmInitializeModelInPlace = (Module["_csmInitializeModelInPlace"] = asm["_csmInitializeModelInPlace"]);
      var _csmMalloc = (Module["_csmMalloc"] = asm["_csmMalloc"]);
      var _csmMallocMoc = (Module["_csmMallocMoc"] = asm["_csmMallocMoc"]);
      var _csmMallocModelAndInitialize = (Module["_csmMallocModelAndInitialize"] = asm["_csmMallocModelAndInitialize"]);
      var _csmReadCanvasInfo = (Module["_csmReadCanvasInfo"] = asm["_csmReadCanvasInfo"]);
      var _csmResetDrawableDynamicFlags = (Module["_csmResetDrawableDynamicFlags"] = asm["_csmResetDrawableDynamicFlags"]);
      var _csmReviveMocInPlace = (Module["_csmReviveMocInPlace"] = asm["_csmReviveMocInPlace"]);
      var _csmUpdateModel = (Module["_csmUpdateModel"] = asm["_csmUpdateModel"]);
      var _emscripten_replace_memory = (Module["_emscripten_replace_memory"] = asm["_emscripten_replace_memory"]);
      var _free = (Module["_free"] = asm["_free"]);
      var _i64Add = (Module["_i64Add"] = asm["_i64Add"]);
      var _i64Subtract = (Module["_i64Subtract"] = asm["_i64Subtract"]);
      var _llvm_bswap_i32 = (Module["_llvm_bswap_i32"] = asm["_llvm_bswap_i32"]);
      var _malloc = (Module["_malloc"] = asm["_malloc"]);
      var _memcpy = (Module["_memcpy"] = asm["_memcpy"]);
      var _memset = (Module["_memset"] = asm["_memset"]);
      var _sbrk = (Module["_sbrk"] = asm["_sbrk"]);
      var establishStackSpace = (Module["establishStackSpace"] = asm["establishStackSpace"]);
      var setThrew = (Module["setThrew"] = asm["setThrew"]);
      var stackAlloc = (Module["stackAlloc"] = asm["stackAlloc"]);
      var stackRestore = (Module["stackRestore"] = asm["stackRestore"]);
      var stackSave = (Module["stackSave"] = asm["stackSave"]);
      var dynCall_ii = (Module["dynCall_ii"] = asm["dynCall_ii"]);
      var dynCall_iiii = (Module["dynCall_iiii"] = asm["dynCall_iiii"]);
      var dynCall_vi = (Module["dynCall_vi"] = asm["dynCall_vi"]);
      var dynCall_viii = (Module["dynCall_viii"] = asm["dynCall_viii"]);
      var dynCall_viiii = (Module["dynCall_viiii"] = asm["dynCall_viiii"]);
      Module["asm"] = asm;
      Module["ccall"] = ccall;
      Module["Pointer_stringify"] = Pointer_stringify;
      if (memoryInitializer) {
        if (!isDataURI(memoryInitializer)) {
          memoryInitializer = locateFile(memoryInitializer);
        }
        if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
          var data = Module["readBinary"](memoryInitializer);
          HEAPU8.set(data, GLOBAL_BASE);
        } else {
          addRunDependency("memory initializer");
          var applyMemoryInitializer = function (data) {
            if (data.byteLength) data = new Uint8Array(data);
            HEAPU8.set(data, GLOBAL_BASE);
            if (Module["memoryInitializerRequest"]) delete Module["memoryInitializerRequest"].response;
            removeRunDependency("memory initializer");
          };
          function doBrowserLoad() {
            Module["readAsync"](memoryInitializer, applyMemoryInitializer, function () {
              throw "could not load memory initializer " + memoryInitializer;
            });
          }
          var memoryInitializerBytes = tryParseAsDataURI(memoryInitializer);
          if (memoryInitializerBytes) {
            applyMemoryInitializer(memoryInitializerBytes.buffer);
          } else if (Module["memoryInitializerRequest"]) {
            function useRequest() {
              var request = Module["memoryInitializerRequest"];
              var response = request.response;
              if (request.status !== 200 && request.status !== 0) {
                var data = tryParseAsDataURI(Module["memoryInitializerRequestURL"]);
                if (data) {
                  response = data.buffer;
                } else {
                  console.warn("a problem seems to have happened with Module.memoryInitializerRequest, status: " + request.status + ", retrying " + memoryInitializer);
                  doBrowserLoad();
                  return;
                }
              }
              applyMemoryInitializer(response);
            }
            if (Module["memoryInitializerRequest"].response) {
              setTimeout(useRequest, 0);
            } else {
              Module["memoryInitializerRequest"].addEventListener("load", useRequest);
            }
          } else {
            doBrowserLoad();
          }
        }
      }
      Module["then"] = function (func) {
        if (Module["calledRun"]) {
          func(Module);
        } else {
          var old = Module["onRuntimeInitialized"];
          Module["onRuntimeInitialized"] = function () {
            if (old) old();
            func(Module);
          };
        }
        return Module;
      };
      function ExitStatus(status) {
        this.name = "ExitStatus";
        this.message = "Program terminated with exit(" + status + ")";
        this.status = status;
      }
      ExitStatus.prototype = new Error();
      ExitStatus.prototype.constructor = ExitStatus;
      var initialStackTop;
      dependenciesFulfilled = function runCaller() {
        if (!Module["calledRun"]) run();
        if (!Module["calledRun"]) dependenciesFulfilled = runCaller;
      };
      function run(args) {
        args = args || Module["arguments"];
        if (runDependencies > 0) {
          return;
        }
        preRun();
        if (runDependencies > 0) return;
        if (Module["calledRun"]) return;
        function doRun() {
          if (Module["calledRun"]) return;
          Module["calledRun"] = true;
          if (ABORT) return;
          ensureInitRuntime();
          preMain();
          if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
          postRun();
        }
        if (Module["setStatus"]) {
          Module["setStatus"]("Running...");
          setTimeout(function () {
            setTimeout(function () {
              Module["setStatus"]("");
            }, 1);
            doRun();
          }, 1);
        } else {
          doRun();
        }
      }
      Module["run"] = run;
      function abort(what) {
        if (Module["onAbort"]) {
          Module["onAbort"](what);
        }
        if (what !== undefined) {
          out(what);
          err(what);
          what = JSON.stringify(what);
        } else {
          what = "";
        }
        ABORT = true;
        EXITSTATUS = 1;
        throw "abort(" + what + "). Build with -s ASSERTIONS=1 for more info.";
      }
      Module["abort"] = abort;
      if (Module["preInit"]) {
        if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
        while (Module["preInit"].length > 0) {
          Module["preInit"].pop()();
        }
      }
      Module["noExitRuntime"] = true;
      run();
      return _em_module;
    };
  })();
  if (typeof exports === "object" && typeof module === "object") module.exports = _em_module;
  else if (typeof define === "function" && define["amd"])
    define([], function () {
      return _em_module;
    });
  else if (typeof exports === "object") exports["_em_module"] = _em_module;
  var _em = _em_module();
  var _csm = (function () {
    function _csm() {}
    _csm.getSizeofModel = function (moc) {
      return _em.ccall("csmGetSizeofModel", "number", ["number"], [moc]);
    };
    _csm.reviveMocInPlace = function (memory, mocSize) {
      return _em.ccall("csmReviveMocInPlace", "number", ["number", "number"], [memory, mocSize]);
    };
    _csm.initializeModelInPlace = function (moc, memory, modelSize) {
      return _em.ccall("csmInitializeModelInPlace", "number", ["number", "number", "number"], [moc, memory, modelSize]);
    };
    _csm.getParameterCount = function (model) {
      return _em.ccall("csmGetParameterCount", "number", ["number"], [model]);
    };
    _csm.getParameterIds = function (model) {
      return _em.ccall("csmGetParameterIds", "number", ["number"], [model]);
    };
    _csm.getParameterMinimumValues = function (model) {
      return _em.ccall("csmGetParameterMinimumValues", "number", ["number"], [model]);
    };
    _csm.getParameterMaximumValues = function (model) {
      return _em.ccall("csmGetParameterMaximumValues", "number", ["number"], [model]);
    };
    _csm.getParameterDefaultValues = function (model) {
      return _em.ccall("csmGetParameterDefaultValues", "number", ["number"], [model]);
    };
    _csm.getParameterValues = function (model) {
      return _em.ccall("csmGetParameterValues", "number", ["number"], [model]);
    };
    _csm.getPartCount = function (model) {
      return _em.ccall("csmGetPartCount", "number", ["number"], [model]);
    };
    _csm.getPartIds = function (model) {
      return _em.ccall("csmGetPartIds", "number", ["number"], [model]);
    };
    _csm.getPartOpacities = function (model) {
      return _em.ccall("csmGetPartOpacities", "number", ["number"], [model]);
    };
    _csm.getPartParentPartIndices = function (model) {
      return _em.ccall("csmGetPartParentPartIndices", "number", ["number"], [model]);
    };
    _csm.getDrawableCount = function (model) {
      return _em.ccall("csmGetDrawableCount", "number", ["number"], [model]);
    };
    _csm.getDrawableIds = function (model) {
      return _em.ccall("csmGetDrawableIds", "number", ["number"], [model]);
    };
    _csm.getDrawableConstantFlags = function (model) {
      return _em.ccall("csmGetDrawableConstantFlags", "number", ["number"], [model]);
    };
    _csm.getDrawableDynamicFlags = function (model) {
      return _em.ccall("csmGetDrawableDynamicFlags", "number", ["number"], [model]);
    };
    _csm.getDrawableTextureIndices = function (model) {
      return _em.ccall("csmGetDrawableTextureIndices", "number", ["number"], [model]);
    };
    _csm.getDrawableDrawOrders = function (model) {
      return _em.ccall("csmGetDrawableDrawOrders", "number", ["number"], [model]);
    };
    _csm.getDrawableRenderOrders = function (model) {
      return _em.ccall("csmGetDrawableRenderOrders", "number", ["number"], [model]);
    };
    _csm.getDrawableOpacities = function (model) {
      return _em.ccall("csmGetDrawableOpacities", "number", ["number"], [model]);
    };
    _csm.getDrawableMaskCounts = function (model) {
      return _em.ccall("csmGetDrawableMaskCounts", "number", ["number"], [model]);
    };
    _csm.getDrawableMasks = function (model) {
      return _em.ccall("csmGetDrawableMasks", "number", ["number"], [model]);
    };
    _csm.getDrawableVertexCounts = function (model) {
      return _em.ccall("csmGetDrawableVertexCounts", "number", ["number"], [model]);
    };
    _csm.getDrawableVertexPositions = function (model) {
      return _em.ccall("csmGetDrawableVertexPositions", "number", ["number"], [model]);
    };
    _csm.getDrawableVertexUvs = function (model) {
      return _em.ccall("csmGetDrawableVertexUvs", "number", ["number"], [model]);
    };
    _csm.getDrawableIndexCounts = function (model) {
      return _em.ccall("csmGetDrawableIndexCounts", "number", ["number"], [model]);
    };
    _csm.getDrawableIndices = function (model) {
      return _em.ccall("csmGetDrawableIndices", "number", ["number"], [model]);
    };
    _csm.mallocMoc = function (mocSize) {
      return _em.ccall("csmMallocMoc", "number", ["number"], [mocSize]);
    };
    _csm.mallocModelAndInitialize = function (moc) {
      return _em.ccall("csmMallocModelAndInitialize", "number", ["number"], [moc]);
    };
    _csm.malloc = function (size) {
      return _em.ccall("csmMalloc", "number", ["number"], [size]);
    };
    _csm.updateModel = function (model) {
      _em.ccall("csmUpdateModel", null, ["number"], [model]);
    };
    _csm.readCanvasInfo = function (model, outSizeInPixels, outOriginInPixels, outPixelsPerUnit) {
      _em.ccall("csmReadCanvasInfo", null, ["number", "number", "number", "number"], [model, outSizeInPixels, outOriginInPixels, outPixelsPerUnit]);
    };
    _csm.resetDrawableDynamicFlags = function (model) {
      _em.ccall("csmResetDrawableDynamicFlags", null, ["number"], [model]);
    };
    _csm.free = function (memory) {
      _em.ccall("csmFree", null, ["number"], [memory]);
    };
    return _csm;
  })();
  var Moc = (function () {
    function Moc(mocBytes) {
      var memory = _csm.mallocMoc(mocBytes.byteLength);
      if (!memory) {
        return;
      }
      var destination = new Uint8Array(_em.HEAPU8.buffer, memory, mocBytes.byteLength);
      destination.set(new Uint8Array(mocBytes));
      this._ptr = _csm.reviveMocInPlace(memory, mocBytes.byteLength);
      if (!this._ptr) {
        _csm.free(memory);
      }
    }
    Moc.fromArrayBuffer = function (buffer) {
      if (!buffer) {
        return null;
      }
      var moc = new Moc(buffer);
      return moc._ptr ? moc : null;
    };
    Moc.prototype._release = function () {
      _csm.free(this._ptr);
      this._ptr = 0;
    };
    return Moc;
  })();
  Live2DCubismCore.Moc = Moc;
  var Model = (function () {
    function Model(moc) {
      this._ptr = _csm.mallocModelAndInitialize(moc._ptr);
      if (!this._ptr) {
        return;
      }
      this.parameters = new Parameters(this._ptr);
      this.parts = new Parts(this._ptr);
      this.drawables = new Drawables(this._ptr);
      this.canvasinfo = new CanvasInfo(this._ptr);
    }
    Model.fromMoc = function (moc) {
      var model = new Model(moc);
      return model._ptr ? model : null;
    };
    Model.prototype.update = function () {
      _csm.updateModel(this._ptr);
    };
    Model.prototype.release = function () {
      _csm.free(this._ptr);
      this._ptr = 0;
    };
    return Model;
  })();
  Live2DCubismCore.Model = Model;
  var CanvasInfo = (function () {
    function CanvasInfo(modelPtr) {
      if (!modelPtr) {
        return;
      }
      var _canvasSize_data = new Float32Array(2);
      var _canvasSize_nDataBytes = _canvasSize_data.length * _canvasSize_data.BYTES_PER_ELEMENT;
      var _canvasSize_dataPtr = _csm.malloc(_canvasSize_nDataBytes);
      var _canvasSize_dataHeap = new Uint8Array(_em.HEAPU8.buffer, _canvasSize_dataPtr, _canvasSize_nDataBytes);
      _canvasSize_dataHeap.set(new Uint8Array(_canvasSize_data.buffer));
      var _canvasOrigin_data = new Float32Array(2);
      var _canvasOrigin_nDataBytes = _canvasOrigin_data.length * _canvasOrigin_data.BYTES_PER_ELEMENT;
      var _canvasOrigin_dataPtr = _csm.malloc(_canvasOrigin_nDataBytes);
      var _canvasOrigin_dataHeap = new Uint8Array(_em.HEAPU8.buffer, _canvasOrigin_dataPtr, _canvasOrigin_nDataBytes);
      _canvasOrigin_dataHeap.set(new Uint8Array(_canvasOrigin_data.buffer));
      var _canvasPPU_data = new Float32Array(1);
      var _canvasPPU_nDataBytes = _canvasPPU_data.length * _canvasPPU_data.BYTES_PER_ELEMENT;
      var _canvasPPU_dataPtr = _csm.malloc(_canvasPPU_nDataBytes);
      var _canvasPPU_dataHeap = new Uint8Array(_em.HEAPU8.buffer, _canvasPPU_dataPtr, _canvasPPU_nDataBytes);
      _canvasPPU_dataHeap.set(new Uint8Array(_canvasPPU_data.buffer));
      _csm.readCanvasInfo(modelPtr, _canvasSize_dataHeap.byteOffset, _canvasOrigin_dataHeap.byteOffset, _canvasPPU_dataHeap.byteOffset);
      _canvasSize_data = new Float32Array(_canvasSize_dataHeap.buffer, _canvasSize_dataHeap.byteOffset, _canvasSize_dataHeap.length);
      _canvasOrigin_data = new Float32Array(_canvasOrigin_dataHeap.buffer, _canvasOrigin_dataHeap.byteOffset, _canvasOrigin_dataHeap.length);
      _canvasPPU_data = new Float32Array(_canvasPPU_dataHeap.buffer, _canvasPPU_dataHeap.byteOffset, _canvasPPU_dataHeap.length);
      this.CanvasWidth = _canvasSize_data[0];
      this.CanvasHeight = _canvasSize_data[1];
      this.CanvasOriginX = _canvasOrigin_data[0];
      this.CanvasOriginY = _canvasOrigin_data[1];
      this.PixelsPerUnit = _canvasPPU_data[0];
      _csm.free(_canvasSize_dataHeap.byteOffset);
      _csm.free(_canvasOrigin_dataHeap.byteOffset);
      _csm.free(_canvasPPU_dataHeap.byteOffset);
    }
    return CanvasInfo;
  })();
  Live2DCubismCore.CanvasInfo = CanvasInfo;
  var Parameters = (function () {
    function Parameters(modelPtr) {
      var length = 0;
      this.count = _csm.getParameterCount(modelPtr);
      length = _csm.getParameterCount(modelPtr);
      this.ids = new Array(length);
      var _ids = new Uint32Array(_em.HEAPU32.buffer, _csm.getParameterIds(modelPtr), length);
      for (var i = 0; i < _ids.length; i++) {
        this.ids[i] = _em.Pointer_stringify(_ids[i]);
      }
      length = _csm.getParameterCount(modelPtr);
      this.minimumValues = new Float32Array(_em.HEAPF32.buffer, _csm.getParameterMinimumValues(modelPtr), length);
      length = _csm.getParameterCount(modelPtr);
      this.maximumValues = new Float32Array(_em.HEAPF32.buffer, _csm.getParameterMaximumValues(modelPtr), length);
      length = _csm.getParameterCount(modelPtr);
      this.defaultValues = new Float32Array(_em.HEAPF32.buffer, _csm.getParameterDefaultValues(modelPtr), length);
      length = _csm.getParameterCount(modelPtr);
      this.values = new Float32Array(_em.HEAPF32.buffer, _csm.getParameterValues(modelPtr), length);
    }
    return Parameters;
  })();
  Live2DCubismCore.Parameters = Parameters;
  var Parts = (function () {
    function Parts(modelPtr) {
      var length = 0;
      this.count = _csm.getPartCount(modelPtr);
      length = _csm.getPartCount(modelPtr);
      this.ids = new Array(length);
      var _ids = new Uint32Array(_em.HEAPU32.buffer, _csm.getPartIds(modelPtr), length);
      for (var i = 0; i < _ids.length; i++) {
        this.ids[i] = _em.Pointer_stringify(_ids[i]);
      }
      length = _csm.getPartCount(modelPtr);
      this.opacities = new Float32Array(_em.HEAPF32.buffer, _csm.getPartOpacities(modelPtr), length);
      length = _csm.getPartCount(modelPtr);
      this.parentIndices = new Int32Array(_em.HEAP32.buffer, _csm.getPartParentPartIndices(modelPtr), length);
    }
    return Parts;
  })();
  Live2DCubismCore.Parts = Parts;
  var Drawables = (function () {
    function Drawables(modelPtr) {
      this._modelPtr = modelPtr;
      var length = 0;
      var length2 = null;
      this.count = _csm.getDrawableCount(modelPtr);
      length = _csm.getDrawableCount(modelPtr);
      this.ids = new Array(length);
      var _ids = new Uint32Array(_em.HEAPU32.buffer, _csm.getDrawableIds(modelPtr), length);
      for (var i = 0; i < _ids.length; i++) {
        this.ids[i] = _em.Pointer_stringify(_ids[i]);
      }
      length = _csm.getDrawableCount(modelPtr);
      this.constantFlags = new Uint8Array(_em.HEAPU8.buffer, _csm.getDrawableConstantFlags(modelPtr), length);
      length = _csm.getDrawableCount(modelPtr);
      this.dynamicFlags = new Uint8Array(_em.HEAPU8.buffer, _csm.getDrawableDynamicFlags(modelPtr), length);
      length = _csm.getDrawableCount(modelPtr);
      this.textureIndices = new Int32Array(_em.HEAP32.buffer, _csm.getDrawableTextureIndices(modelPtr), length);
      length = _csm.getDrawableCount(modelPtr);
      this.drawOrders = new Int32Array(_em.HEAP32.buffer, _csm.getDrawableDrawOrders(modelPtr), length);
      length = _csm.getDrawableCount(modelPtr);
      this.renderOrders = new Int32Array(_em.HEAP32.buffer, _csm.getDrawableRenderOrders(modelPtr), length);
      length = _csm.getDrawableCount(modelPtr);
      this.opacities = new Float32Array(_em.HEAPF32.buffer, _csm.getDrawableOpacities(modelPtr), length);
      length = _csm.getDrawableCount(modelPtr);
      this.maskCounts = new Int32Array(_em.HEAP32.buffer, _csm.getDrawableMaskCounts(modelPtr), length);
      length = _csm.getDrawableCount(modelPtr);
      this.vertexCounts = new Int32Array(_em.HEAP32.buffer, _csm.getDrawableVertexCounts(modelPtr), length);
      length = _csm.getDrawableCount(modelPtr);
      this.indexCounts = new Int32Array(_em.HEAP32.buffer, _csm.getDrawableIndexCounts(modelPtr), length);
      length = _csm.getDrawableCount(modelPtr);
      length2 = new Int32Array(_em.HEAP32.buffer, _csm.getDrawableMaskCounts(modelPtr), length);
      this.masks = new Array(length);
      var _masks = new Uint32Array(_em.HEAPU32.buffer, _csm.getDrawableMasks(modelPtr), length);
      for (var i = 0; i < _masks.length; i++) {
        this.masks[i] = new Int32Array(_em.HEAP32.buffer, _masks[i], length2[i]);
      }
      length = _csm.getDrawableCount(modelPtr);
      length2 = new Int32Array(_em.HEAP32.buffer, _csm.getDrawableVertexCounts(modelPtr), length);
      this.vertexPositions = new Array(length);
      var _vertexPositions = new Uint32Array(_em.HEAPU32.buffer, _csm.getDrawableVertexPositions(modelPtr), length);
      for (var i = 0; i < _vertexPositions.length; i++) {
        this.vertexPositions[i] = new Float32Array(_em.HEAPF32.buffer, _vertexPositions[i], length2[i] * 2);
      }
      length = _csm.getDrawableCount(modelPtr);
      length2 = new Int32Array(_em.HEAP32.buffer, _csm.getDrawableVertexCounts(modelPtr), length);
      this.vertexUvs = new Array(length);
      var _vertexUvs = new Uint32Array(_em.HEAPU32.buffer, _csm.getDrawableVertexUvs(modelPtr), length);
      for (var i = 0; i < _vertexUvs.length; i++) {
        this.vertexUvs[i] = new Float32Array(_em.HEAPF32.buffer, _vertexUvs[i], length2[i] * 2);
      }
      length = _csm.getDrawableCount(modelPtr);
      length2 = new Int32Array(_em.HEAP32.buffer, _csm.getDrawableIndexCounts(modelPtr), length);
      this.indices = new Array(length);
      var _indices = new Uint32Array(_em.HEAPU32.buffer, _csm.getDrawableIndices(modelPtr), length);
      for (var i = 0; i < _indices.length; i++) {
        this.indices[i] = new Uint16Array(_em.HEAPU16.buffer, _indices[i], length2[i]);
      }
    }
    Drawables.prototype.resetDynamicFlags = function () {
      _csm.resetDrawableDynamicFlags(this._modelPtr);
    };
    return Drawables;
  })();
  Live2DCubismCore.Drawables = Drawables;
  var Utils = (function () {
    function Utils() {}
    Utils.hasBlendAdditiveBit = function (bitfield) {
      return (bitfield & (1 << 0)) == 1 << 0;
    };
    Utils.hasBlendMultiplicativeBit = function (bitfield) {
      return (bitfield & (1 << 1)) == 1 << 1;
    };
    Utils.hasIsDoubleSidedBit = function (bitfield) {
      return (bitfield & (1 << 2)) == 1 << 2;
    };
    Utils.hasIsVisibleBit = function (bitfield) {
      return (bitfield & (1 << 0)) == 1 << 0;
    };
    Utils.hasVisibilityDidChangeBit = function (bitfield) {
      return (bitfield & (1 << 1)) == 1 << 1;
    };
    Utils.hasOpacityDidChangeBit = function (bitfield) {
      return (bitfield & (1 << 2)) == 1 << 2;
    };
    Utils.hasDrawOrderDidChangeBit = function (bitfield) {
      return (bitfield & (1 << 3)) == 1 << 3;
    };
    Utils.hasRenderOrderDidChangeBit = function (bitfield) {
      return (bitfield & (1 << 4)) == 1 << 4;
    };
    Utils.hasVertexPositionsDidChangeBit = function (bitfield) {
      return (bitfield & (1 << 5)) == 1 << 5;
    };
    return Utils;
  })();
  Live2DCubismCore.Utils = Utils;
})(Live2DCubismCore || (Live2DCubismCore = {}));

export { Live2DCubismCore };
