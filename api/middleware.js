
/* middleware.js */

import { Application, send, Status } from 'https://deno.land/x/oak@v10.4.0/mod.ts'
import { oakCors } from 'https://deno.land/x/cors/mod.ts'
import { extractCredentials, fileExists, getEtag, setHeaders, validJWT } from './modules/util.js'
import { login } from './modules/accounts.js'

import router from './routes.js'

const app = new Application()

async function checkContentType(context, next) {
	console.log('middleware: checkContentType')

	const path = context.request.url.pathname
	const contentType = context.request.headers.get('Content-Type')

	// if not an API call content-type not important
	if(path.includes('/api/') == false) {
		await next()
		return // we don't want to continue this script on unwind
	}

	if(contentType !== 'application/vnd.api+json') {
		console.log('wrong Content-Type')
		context.response.status = 415
		context.response.body = JSON.stringify(
			{
				errors: [
					{
						title: '415 Unsupported Media Type',
						detail: 'This API supports the JSON:API specification, Content-Type must be application/vnd.api+json'
					}
				]
			}
			, null, 2)
			return
	}

	await next()
	return
}

async function authHeaderPresent(context, next) {
	console.log('middleware: authHeaderPresent')

	const path = context.request.url.pathname
	const method = context.request.method

	// if not an API call content-type not important
	if(path.includes('/api/') == false) {
		await next()
		return // we don't want to continue this script on unwind
	}

	if(path === '/api/accounts' && method === 'POST') {
		console.log('account registration so auth header not needed')
		await next()
		return
	}

	if(context.request.headers.get('Authorization') === null) {
		console.log('missing Authorization header')
		context.response.status = 401
		context.response.body = JSON.stringify(
			{
				errors: [
					{
						title: '201 Unauthorized',
						detail: 'the API uses JWT and requires a correctly-formatted Authorization header'
					}
				]
			}
		, null, 2)
		return
	}

	await next()
	return
}

async function validCredentials(context, next) {

	const path = context.request.url.pathname
	const method = context.request.method
	const token = context.request.headers.get('Authorization')

	// if not an API call content-type not important
	if(path.includes('/api/') === false) {
		console.log('not an API call so content-type not important')
		await next()
		return // we don't want to continue this script on unwind
	}

	// registering a new account so auth header not needed
	if(path === '/api/accounts') {
		await next()
		return
	}

	try {
		const [type, hash] = token.split(' ')
		await validJWT(hash)
	} catch(err) {
		console.log('ERROR')
		console.log(err)
		console.log(`msg: ${err.message}`)
		context.response.status = 401
		context.response.body = JSON.stringify(
			{
				errors: [
					{
						title: '401 Unauthorized!',
						detail: err.message
					}
				]
			}
			, null, 2)
		return
	}

	await next()
}

async function staticFiles(context, next) {
	const path = `${Deno.cwd()}/spa/${context.request.url.pathname}`
	const isFile = await fileExists(path)
	if (isFile) {
		// file exists therefore we can serve it
		console.log(path)
		const etag = await getEtag(path)
		console.log(`etag: ${etag}`)
		context.response.headers.set('ETag', etag)
		await send(context, context.request.url.pathname, {
			root: `${Deno.cwd()}/spa`,
		})
	} else {
		await next()
	}
}

async function errorHandler(context, next) {
  try {
    const method = context.request.method;
    const path = context.request.url.pathname;
    console.log(`${method} ${path}`);
    await next();
  } catch (err) {
    console.log(err)
    context.response.status = Status.InternalServerError
		context.response.body = JSON.stringify(
			{
				errors: [
					{
						title: '500 Internal Server error',
						detail: err.message
					}
				]
			}
			, null, 2)
		context.response.body = JSON.stringify(msg, null, 2)
	}
	return
}

const corsOpt = {
	// To use api testing tools set origin: '*'
	origin: 'https://hair-vienna-8080.codio-box.uk',
	methods: ['GET', 'POST', 'PUT'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	credentials: true
}

app.use(oakCors(corsOpt))
app.use(errorHandler)
app.use(checkContentType)
app.use(authHeaderPresent)
app.use(validCredentials)
app.use(staticFiles)
app.use(router.routes())
app.use(router.allowedMethods())
app.use(setHeaders)

export default app