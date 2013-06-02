/********************************************************************************************
* Twitch Broadcasting SDK
*
* This software is supplied under the terms of a license agreement with Twitch Interactive, Inc. and
* may not be copied or used except in accordance with the terms of that agreement
* Copyright (c) 2012-2014 Twitch Interactive, Inc.
*********************************************************************************************/

#pragma once

#include "errortypes.h"

/**
 * Callback signature for asynchronous tasks
 */
typedef void (*TTV_TaskCallback) (TTV_ErrorCode result, void* userData);
