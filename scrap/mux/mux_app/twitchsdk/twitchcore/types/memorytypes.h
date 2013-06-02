/********************************************************************************************
* Twitch Broadcasting SDK
*
* This software is supplied under the terms of a license agreement with Twitch Interactive, Inc. and
* may not be copied or used except in accordance with the terms of that agreement
* Copyright (c) 2012-2014 Twitch Interactive, Inc.
*********************************************************************************************/

#pragma once

/**
 * Memory allocation callback function signatures
 */
typedef void* (*TTV_AllocCallback) (size_t size, size_t alignment);
typedef void (*TTV_FreeCallback) (void* ptr);


/**
 * TTV_MemCallbacks - Pointers to memory allocation callback functions provided by the client
 */
typedef struct
{
	size_t size;							/* Size of the struct */
	TTV_AllocCallback allocCallback;		/* Memory allocation callback function provided by the client */
	TTV_FreeCallback  freeCallback;			/* Memory deallocation callback function provided by the client */
} TTV_MemCallbacks;


// Default aligned malloc/free if the client doesn't provide them
// These are just wrappers around the functions provided by the CRT
//
void* DefaultAlignedMalloc(size_t size, size_t alignment);
void DefaultAlignedFree(void* p);
