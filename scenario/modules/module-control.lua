--- Desction <get from json>
-- @module ThisModule@X.Y.Z
-- @author <get from json>
-- @license <get from json>
-- @alais ThisModule 

-- Module Require
local Module = require('Module@>X.Y.Z')
local SubModule = require('Collection.Submodule@^X.Y.Z')
local OptModule -- OptModule@^X.Y.Z

-- Local Varibles

-- Module Define
local module_verbose = false
local ThisModule = {
    on_init=function()
        if loaded_modules['OptModule@^X.Y.Z'] then OptModule = require('OptModule@^X.Y.Z') end
        --code
    end,
    on_post=function()
        --code
    end
}

-- Global Define
local global = global{
    key='value'
}

-- Function Define

-- Event Handlers Define

-- Module Return
return ThisModule 