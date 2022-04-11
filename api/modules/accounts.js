
/* accounts.js */

import { compare, genSalt, hash } from 'https://deno.land/x/bcrypt@v0.2.4/mod.ts'
import { db } from './db.js'

const saltRounds = 10
const salt = await genSalt(saltRounds)

// Check whether login credentials are correct
export async function login(user, pass) {
	let sql = `SELECT count(id) AS count FROM accounts WHERE user="${user}";`
	let records = await db.query(sql)
	if(!records[0].count) throw new Error(`username "${user}" not found`)
	sql = `SELECT pass FROM accounts WHERE user = "${user}";`
	records = await db.query(sql)
	const valid = await compare(pass, records[0].pass)
	if(valid === false) throw new Error(`invalid password for account "${user}"`)
	
	sql = `SELECT id FROM accounts WHERE user="${user}";`
	let userid = await db.query(sql)
	console.log(`USERID: ${JSON.stringify(userid)}`)
	
	sql = `SELECT manager FROM roles WHERE userid="${userid[0].id}";`
	let role = await db.query(sql)
	role = role[0].manager
	
	console.log(`USER: ${user} ::: ROLE: ${role}`)
	return { user, role }
}

// Add new credentials to the database
export async function register(credentials) {
	let { user, pass, fullname, avatar } = credentials
	const userList = await db.query(`SELECT user FROM accounts WHERE user="${user}";`)
	if (userList.length > 0) {
		console.log('Username already in use')
		throw new Error('Username already in use')
	}
	pass = await hash(pass, salt)
	let sql = `INSERT INTO accounts(user, pass, fullname, avatar) VALUES("${user}", "${pass}", "${fullname}", "${avatar}");`
	await db.query(sql)
	const userId = await db.query(`SELECT id FROM accounts WHERE user="${user}";`)
	sql = `INSERT INTO roles(userid, manager) VALUES("${userId[0].id}", 0);`
	console.log(sql)
	await db.query(sql)

	return true
}

// Retrieve list of users that are not manager
export async function getUsers() {
	const users = await db.query(`SELECT roles.userid, accounts.user, accounts.fullname, accounts.avatar FROM accounts INNER JOIN roles ON accounts.id=roles.userid WHERE manager="0";`)

	return users
}
