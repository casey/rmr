/********************************************************************************************
* Twitch Broadcasting SDK
*
* This software is supplied under the terms of a license agreement with Twitch Interactive, Inc. and
* may not be copied or used except in accordance with the terms of that agreement
* Copyright (c) 2012-2014 Twitch Interactive, Inc.
*********************************************************************************************/

#pragma once

/**
* TTV_MessageLevel - Level of debug messages to be printed
*/
typedef enum
{
	TTV_ML_DEBUG,
	TTV_ML_INFO,
	TTV_ML_WARNING,
	TTV_ML_ERROR,
	TTV_ML_CHAT,

	TTV_ML_NONE // this must appear last (since a given value and the values greater are the ones logged - "none" at the highest value effectively disables logging)
} TTV_MessageLevel;
