
/* routes.js */

import { Router } from 'https://deno.land/x/oak@v6.5.1/mod.ts'

import { extractCredentials, saveFile } from './modules/util.js'
import { login, register, getUsers } from './modules/accounts.js'
import { addExpense, getExpenses, getExpenseDesc, getReceipt, changeExpenseStatus } from './modules/expenses.js'

const router = new Router()

// the routes defined here
router.get('/', async context => {
	console.log('GET /')
	const data = await Deno.readTextFile('spa/index.html')
	context.response.body = data
})

router.get('/api/accounts', async context => {
	console.log('GET /api/accounts')
	const token = context.request.headers.get('Authorization')
	console.log(`auth: ${token}`)
	try {
		const credentials = extractCredentials(token)
		console.log(credentials)
		const { user, role } = await login(credentials)
		console.log(`username: ${user}`)
		console.log(`role: ${role}`)
		context.response.body = JSON.stringify({ status: 'success', username: user, role: role })
	} catch(err) {
		context.response.status = 401
		context.response.body = JSON.stringify(
			{
				errors: [
					{
						title: '401 Unauthorized.',
						detail: err.message
					}
				]
			}
		, null, 2)
	}
})

router.post('/api/accounts', async context => {
	console.log('POST /api/accounts')
	const body  = await context.request.body()
	const data = await body.value
	console.log(data)
	try {
		await register(data)
		context.response.status = 201
		context.response.body = JSON.stringify({ status: 'success', msg: 'account created' })
	} catch(err) {
		context.response.status = 409
		context.response.body = JSON.stringify(
			{
				errors: [
					{
						title: 'a problem occurred',
						detail: err.message
					}
				]
			}
		)
	}
})

router.post('/api/files', async context => {
	console.log('POST /api/files')
	try {
		const token = context.request.headers.get('Authorization')
		console.log(`auth: ${token}`)
		const body  = await context.request.body()
		const data = await body.value
		console.log(data)
		const filename = saveFile(data.base64, data.user)
		context.response.status = 201
		context.response.body = JSON.stringify(
			{
				data: {
					filepath: `./spa/uploads/${filename}`,
					message: 'file uploaded'
				}
			}
		)
	} catch(err) {
		context.response.status = 400
		context.response.body = JSON.stringify(
			{
				errors: [
					{
						title: 'a problem occurred',
						detail: err.message
					}
				]
			}
		)
	}
})

// User List for managers
router.get("/api/users", async context => {      
	console.log('GET /api/users')
	const token = context.request.headers.get('Authorization')
	console.log(`auth: ${token}`)
	try {
		const credentials = extractCredentials(token)
		console.log(credentials)
		const { user, role } = await login(credentials)
		if (role !== 1) throw new Error(`Not manager`)
		const users = await getUsers();
		context.response.body = JSON.stringify({ status: 'success', users: users })
	} catch(err) {
		context.response.status = 401
		context.response.body = JSON.stringify(
			{
				errors: [
					{
						title: '401 Unauthorized.',
						detail: err.message
					}
				]
			}
		, null, 2)
	}
})

// User description
router.get("/api/users/:id", async context => {      
	console.log('GET /api/users/id')
})
router.post("/api/users/:id", async context => {      
	console.log('POST /api/users/id')
})

// Expense Description
router.get("/api/expenses/:id", async context => {      
	console.log('GET /api/expenses/id')
	try {
		const id = context.params.id
		console.log(id)

		const token = context.request.headers.get('Authorization')
		console.log(`auth: ${token}`)

		const credentials = extractCredentials(token)
		const { user, role } = await login(credentials)

		const expense = await getExpenseDesc(id)

		context.response.status = 201
		context.response.body = JSON.stringify({ status: 'success', expense: expense})
	} catch(err) {
		context.response.status = 400
		context.response.body = JSON.stringify(
			{
				errors: [
					{
						title: 'a problem occurred',
						detail: err.message
					}
				]
			}
		)
	}
})
router.put("/api/expenses/:id", async context => {      
	console.log('PUT /api/expenses/id')
	try {
		const id = context.params.id
		console.log(id)

		const token = context.request.headers.get('Authorization')
		console.log(`auth: ${token}`)

		const body = await context.request.body()
		const data = await body.value
		const credentials = extractCredentials(token)
		const { user, role } = await login(credentials)

		console.log(`change ${data.change}`)
		if (role !== 1) throw new Error("Manager only functionality")
		await changeExpenseStatus(id, data.change)

		context.response.status = 201
		context.response.body = JSON.stringify({ status: 'success', msg: `Status of ${id} changed to ${data.change}`})
	} catch(err) {
		context.response.status = 400
		context.response.body = JSON.stringify(
			{
				errors: [
					{
						title: 'a problem occurred',
						detail: err.message
					}
				]
			}
		)
	}
})

// Get all expenses
router.get("/api/expenses", async context => {      
	console.log('GET /api/expenses')
	try {
		const token = context.request.headers.get('Authorization')
		console.log(`auth: ${token}`)

		const credentials = extractCredentials(token)
		const logged = await login(credentials)
		console.log(`username on routes.js ${JSON.stringify(logged.user)}`)
		console.log(`role on routes.js ${JSON.stringify(logged.role)}`)
		const { info, count } = await getExpenses(logged.user, logged.role)
		console.log(info, count)
		context.response.status = 201
		context.response.body = JSON.stringify({ status: 'success', info: info, count: count})
	} catch(err) {
		context.response.status = 400
		context.response.body = JSON.stringify(
			{
				errors: [
					{
						title: 'a problem occurred',
						detail: err.message
					}
				]
			}
		)
	}
})
// Add Expense
router.post("/api/expenses", async context => {      
	console.log('POST /api/expenses')
	try {
		const token = context.request.headers.get('Authorization')
		console.log(`auth: ${token}`)
		const body  = await context.request.body()
		const data = await body.value

		const credentials = extractCredentials(token)
		const username = await login(credentials)

		await addExpense(data)
		context.response.status = 201
		context.response.body = JSON.stringify({ status: 'success', msg: 'expense added' })
	} catch(err) {
		context.response.status = 400
		context.response.body = JSON.stringify(
			{
				errors: [
					{
						title: 'a problem occurred',
						detail: err.message
					}
				]
			}
		)
	}
})

router.get("/(.*)", async context => {      
// 	const data = await Deno.readTextFile('static/404.html')
// 	context.response.body = data
	const data = await Deno.readTextFile('spa/index.html')
	context.response.body = data
})

export default router

