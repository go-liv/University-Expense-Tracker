
/* util.js */

import { Status } from 'https://deno.land/x/oak@v6.5.1/mod.ts'
import { Base64 } from 'https://deno.land/x/bb64/mod.ts'
import { Md5 } from 'https://deno.land/std/hash/md5.ts'
import { decode, create, verify } from "https://deno.land/x/djwt@v2.4/mod.ts";

// Key for JWT token generation
const key = await crypto.subtle.generateKey(
  { name: "HMAC", hash: "SHA-512" },
  true,
  ["sign", "verify"],
);

export function setHeaders(context, next) {
	console.log('setHeaders')
	context.response.headers.set('Content-Type', 'application/vnd.api+json')
	context.response.headers.set('charset', 'utf-8')
	context.response.headers.set('Access-Control-Allow-Origin', '*')
	context.response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE')
	context.response.headers.set('Access-Control-Allow-Headers', 'X-Requested-With,content-type')
	context.response.headers.set('Access-Control-Allow-Credentials', true)
	next()
}

// Decode JWT token to extract user and role
export async function decodeJWT(jwt) {
	const [header, payload, signature] = await decode(jwt)
	return payload
}

// Create JWT token, used on login
export async function createJWT(user, role) {
	console.log(`USER: ${user}`)
	const jwt = await create({ alg: "HS512", typ: "JWT" }, { username: user, role: role }, key)
	return jwt
}

// Verify the JWT token, used on middleware to assure the requests use valid JWTs
export async function validJWT(jwt) {
	try {
		const payload = await verify(jwt, key);
		return payload
	} catch(err) {
		console.log(err)
		throw new Error(err)
	}
}

// Extract user and role from the JWT
export function extractCredentials(token) {
	console.log('checkAuth')
	if(token === undefined) throw new Error('no auth header')
	const [type, hash] = token.split(' ')
	console.log(`${type} : ${hash}`)
	if(type !== 'Bearer') throw new Error('wrong auth type')
	const {user, role} = decodeJWT(hash)
	return { user, role }
}

// https://github.com/thecodeholic/deno-serve-static-files/blob/final-version/oak/staticFileMiddleware.ts
export async function staticFiles(context, next) {
	const path = `${Deno.cwd()}/static${context.request.url.pathname}`
  const isFile = await fileExists(path)
  if (isFile) {
		// file exists therefore we can serve it
    await context.send(context, context.request.url.pathname, {
      root: `${Deno.cwd()}/static`
    })
  } else {
    await next()
  }
}

export async function errorHandler(context, next) {
	try {
		const method = context.request.method
		const path = context.request.url.pathname
		console.log(`${method} ${path}`)
    await next()
  } catch (err) {
		console.log(err)
		context.response.status = Status.InternalServerError
		const msg = { err: err.message }
		context.response.body = JSON.stringify(msg, null, 2)
  }
}

// checks if file exists
export async function fileExists(path) {
  try {
    const stats = await Deno.lstat(path)
    return stats && stats.isFile
  } catch(e) {
    if (e && e instanceof Deno.errors.NotFound) {
      return false
    } else {
      throw e
    }
  }
}

export function saveFile(base64String, username) {
	console.log('save file')
	const [ metadata, base64Image ] = base64String.split(';base64,')
	console.log(metadata)
	console.log(extension)
	const filename = `${username}-${Date.now()}.${extension}`
	console.log(filename)
	Base64.fromBase64String(base64Image).toFile(`./spa/uploads/${filename}`)
	console.log('file saved')
	return filename
}

export async function getEtag(path) {
	const stat = await Deno.stat(path)
	const mtime = stat.mtime
	const timestamp = Date.parse(mtime)
	const size = stat.size
	const uid = (`${path}:${timestamp}:${size}`)
	const md5 = new Md5()
	const etag = md5.update(uid).toString()
	return etag
}
