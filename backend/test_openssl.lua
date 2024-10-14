local ffi = require("ffi")

ffi.cdef[[
    const char* OpenSSL_version(int t);
]]

local version = ffi.C.OpenSSL_version(0)
print(ffi.string(version))


