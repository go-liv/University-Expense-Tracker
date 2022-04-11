
/* routes.js */

import { Router } from 'https://deno.land/x/oak@v6.5.1/mod.ts'

import { extractCredentials, saveFile, createJWT, decodeJWT} from './modules/util.js'
import { login, register, getUsers } from './modules/accounts.js'
import { addExpense, getExpenses, getExpenseDesc, getReceipt, changeExpenseStatus } from './modules/expenses.js'

const router = new Router()

function hostname(url) {
	const matches = String(url).match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i);
	const hostname = matches ? matches[1] : null

	return hostname
}
// the routes defined here
router.get('/api/accounts', async context => {
	console.log('GET /api/accounts')
	const token = context.request.headers.get('Authorization')
	console.log(`auth: ${token}`)
	try {
		console.log('checkAuth')
		if(token === undefined) throw new Error('no auth header')
		const [type, hash] = token.split(' ')
		if(type !== 'Basic') throw new Error('wrong auth type')
		const str = atob(hash)
		if(str.indexOf(':') === -1) throw new Error('invalid auth format')
		const [user, pass] = str.split(':')
		console.log(`username: ${user}`)
		const creds = await login(user, pass)
		console.log(`username: ${creds.user}`)
		console.log(`role: ${creds.role}`)
		// create jwt cookie
        const jwt = await createJWT(creds.user, creds.role)
		context.response.body = { 
			status: 'success',
			schema: {
				username: 'string',
				role: 'number',
				jwtHash: 'string'
			}, 
			username: creds.user, 
			role: creds.role, 
			jwtHash: jwt,
			links: {
				self: {
					name: 'login',
					desc: 'login in the system',
					href: `https://${hostname(context.request.url)}/api/expenses`,
					type: 'GET',
				},
				register: {
					name: 'register',
					desc: 'register a new user account',
					href: `https://${hostname(context.request.url)}/api/accounts`,
					type: 'POST'
				}
			}
		}
	} catch(err) {
		context.response.status = 401
		context.response.body = {
			errors: [
				{
					title: '401 Unauthorized.',
					detail: err.message
				}
			]
		}
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
		context.response.body = { 
			status: 'success', 
			msg: 'account created',
			links: {
				self: {
					name: 'register',
					desc: 'register a new user account',
					href: `https://${hostname(context.request.url)}/api/accounts`,
					type: 'POST'
				},
				login: {
					name: 'login',
					desc: 'login in the system',
					href: `https://${hostname(context.request.url)}/api/expenses`,
					type: 'GET',
				}
			}
		}
	} catch(err) {
		context.response.status = 409
		context.response.body = {
			errors: [
				{
					title: 'a problem occurred',
					detail: err.message
				}
			]
		}
	}
})

// User List for managers
router.get("/api/users", async context => {
	console.log('GET /api/users')
	const token = context.request.headers.get('Authorization')
	const [type, hash] = token.split(' ')
	console.log(`auth: ${token}`)
	try {
		const { username, role } = await decodeJWT(hash)
		if (role !== 1) throw new Error(`Not manager`)
		const users = await getUsers();
		context.response.body = { 
			status: 'success',
			schema: {
				users: [{
					userid: 'number',
					user: 'string',
					fullname: 'string',
					avatar: 'string'
				}]
			},
			users: users,
			links: {
				self: {
					name: 'userList',
					desc: 'description of all users',
					href: `https://${hostname(context.request.url)}/api/users`,
					type: 'GET'
				},
				expenses: [
					{
						name: 'expenses',
						desc: 'retrieve expenses for single user, or for manager',
						href: `https://${hostname(context.request.url)}/api/expenses`,
						type: 'GET',
					},
					{
						name: 'expenses',
						desc: 'add expense to database under username in authorization',
						href: `https://${hostname(context.request.url)}/api/expenses`,
						type: 'POST',
					}
				]
			}
		}
	} catch(err) {
		context.response.status = 401
		context.response.body = {
			errors: [
				{
					title: '401 Unauthorized.',
					detail: err.message
				}
			]
		}
	}
})

// Expense Description
router.get("/api/expenses/:id", async context => {      
	console.log('GET /api/expenses/id')
	try {
		const id = context.params.id
		console.log(id)

		const token = context.request.headers.get('Authorization')
		const [type, hash] = token.split(' ')
		console.log(`auth: ${token}`)
		const { username, role } = await decodeJWT(hash)

		const expense = await getExpenseDesc(id, username, role)
		console.log(expense)
		if(expense.length <= 0) throw new Error('Expenses unexisting or the user is not the owner of this expense.')
		context.response.status = 201
		context.response.body = { 
			status: 'success',
			schema: {
				expense: {
					id: 'number',
					user: 'string',
					currDate: 'ISO8601 string',
					approvalStatus: 'not-approved',
					incDate: 'ISO8601 string',
					category: 'string',
					label: 'string',
					amount: 'number',
					description: 'string',
					receipt: 'string',
				}
			},
			expense: expense,
			links: {
				self: {
					name: 'expenseDesc',
					desc: 'description of expense with id',
					href: `https://${hostname(context.request.url)}/api/expenses/:id`,
					type: 'GET'
				},
				changeStatus: {
					name: 'changeStatus',
					desc: 'change expense status',
					href: `https://${hostname(context.request.url)}/api/expenses/:id`,
					type: 'PUT'
				}
			}
		}
	} catch(err) {
		context.response.status = 400
		context.response.body = {
			errors: [
				{
					title: 'a problem occurred',
					detail: err.message
				}
			]
		}
	}
})
router.put("/api/expenses/:id", async context => {      
	console.log('PUT /api/expenses/id')
	try {
		const id = context.params.id
		console.log(id)

		const token = context.request.headers.get('Authorization')
		const [type, hash] = token.split(' ')
		console.log(`auth: ${token}`)
		const { username, role } = await decodeJWT(hash)

		const body = await context.request.body()
		const data = await body.value

		console.log(`change ${data.change}`)
		if (role !== 1) throw new Error("Manager only functionality")
		if(data.change !== 'declined' && data.change !== 'approved') throw new Error('Change of status only available for declined or approved')
		await changeExpenseStatus(id, data.change)

		context.response.status = 201
		context.response.body = { 
			status: 'success', 
			msg: `Status of ${id} changed to ${data.change}`,
			links: {
				self: {
					name: 'changeStatus',
					desc: 'change expense status',
					href: `https://${hostname(context.request.url)}/api/expenses/:id`,
					type: 'PUT'
				},
				description: {
						name: 'expenseDesc',
						desc: 'description of expense with id',
						href: `https://${hostname(context.request.url)}/api/expenses/:id`,
						type: 'GET'
				}
			}
		}
	} catch(err) {
		context.response.status = 400
		context.response.body = {
			errors: [
				{
					title: 'a problem occurred',
					detail: err.message
				}
			]
		}
	}
})

// Get all expenses
router.get("/api/expenses", async context => {      
	console.log('GET /api/expenses')
	try {
		const token = context.request.headers.get('Authorization')
		const [type, hash] = token.split(' ')
		console.log(`auth: ${token}`)
		const { username, role } = await decodeJWT(hash)
		const { info, count } = await getExpenses(username, role)
		console.log(info, count)
		context.response.status = 201
		context.response.body = { 
			status: 'success',
			schema: {
				info: [{
					id: 'number',
					currDate: 'ISO8601 string',
					incDate: 'ISO8601 string',
					label: 'string',
					amount: 'number',
				}],
				count: 'number'
			}, 
			info: info, 
			count: count,
			links: {
				self: [
					{
						name: 'expenses',
						desc: 'retrieve expenses for single user, or for manager',
						href: `https://${hostname(context.request.url)}/api/expenses`,
						type: 'GET',
					},
					{
						name: 'expenses',
						desc: 'add expense to database under username in authorization',
						href: `https://${hostname(context.request.url)}/api/expenses`,
						type: 'POST',
					}
				],
				description: [
					{
						name: 'expenseDesc',
						desc: 'description of expense with id',
						href: `https://${hostname(context.request.url)}/api/expenses/:id`,
						type: 'GET'
					},
					{
						name: 'changeStatus',
						desc: 'change expense status',
						href: `https://${hostname(context.request.url)}/api/expenses/:id`,
						type: 'PUT'
					}
				]
			}  
		}
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
		const [type, hash] = token.split(' ')
		console.log(`auth: ${token}`)
		const { username, role } = await decodeJWT(hash)
		
		const body  = await context.request.body()
		const data = await body.value

		if(data.user !== username) throw new Error('Not the same user as jwt')
		
		await addExpense(data)
		context.response.status = 201
		context.response.body = { 
			status: 'success', 
			msg: 'expense added',
			links: {
				self: [
					{
						name: 'expenses',
						desc: 'add expense to database under username in authorization',
						href: `https://${hostname(context.request.url)}/api/expenses`,
						type: 'POST',
					},
					{
						name: 'expenses',
						desc: 'retrieve expenses for single user, or for manager',
						href: `https://${hostname(context.request.url)}/api/expenses`,
						type: 'GET',
					}
				],
				description: [
					{
						name: 'expenseDesc',
						desc: 'description of expense with id',
						href: `https://${hostname(context.request.url)}/api/expenses/:id`,
						type: 'GET'
					},
					{
						name: 'changeStatus',
						desc: 'change expense status',
						href: `https://${hostname(context.request.url)}/api/expenses/:id`,
						type: 'PUT'
					}
				]
			} 
		}
	} catch(err) {
		context.response.status = 400
		context.response.body = {
			errors: [
				{
					title: 'a problem occurred',
					detail: err.message
				}
			]
		}
	}
})

router.get("/(.*)", async context => {      
// 	const data = await Deno.readTextFile('static/404.html')
// 	context.response.body = data
	const data = await Deno.readTextFile('spa/index.html')
	context.response.body = data
})

export default router

