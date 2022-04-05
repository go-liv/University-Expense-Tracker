import { format } from "https://deno.land/std@0.91.0/datetime/mod.ts";

import { db } from './db.js'

export async function addExpense(data) {
	if(!(data.receipt.includes("image"))) throw new Error('Unsupported File Type!')
    const currDateTime = format(new Date(), "yyyy-MM-dd HH:mm:ss")
	const sql = `INSERT INTO expense(user, currDate, incDate, category, label, amount, description, receipt) 
    VALUES("${data.user}", "${currDateTime}", "${data.incDate}", "${data.category}", "${data.label}", "${data.amount}", "${data.description}", "${data.receipt}");`
	await db.query(sql)
	return true
}

export async function getExpenses(user, role) {
	if (role === 1) {
		const getExpenseInfo = `SELECT * FROM expense WHERE approvalStatus="not-approved" ORDER BY incDate DESC;`
		const info = await db.query(getExpenseInfo)
		const getCount = `SELECT count(id) as count FROM expense WHERE approvalStatus="not-approved";`
		const count = await db.query(getCount)
		return { info, count }
	} else {
		const getExpenseInfo = `SELECT id, currDate, incDate, label, amount FROM expense WHERE user="${user}" AND approvalStatus="not-approved" ORDER BY incDate DESC;`
		const info = await db.query(getExpenseInfo)
		console.log(info)
		const getCount = `SELECT count(id) as count FROM expense WHERE user="${user}" AND approvalStatus="not-approved";`
		const count = await db.query(getCount)
		return { info, count }
	}
}

export async function getExpenseDesc(id) {
	const getExpenseDesc = `SELECT * FROM expense WHERE id="${id}";`
	const expense = await db.query(getExpenseDesc)
	console.log(expense)
	return expense
} 

export async function getReceipt(id) {
	const getReceiptUrl = `SELECT location FROM receipts WHERE id="${id}";`
	const url = await db.query(getReceiptUrl)
	console.log(url)
	return url
}

export async function changeExpenseStatus(id, change) {
	const updateExpense = `UPDATE expense SET approvalStatus="${change}" WHERE id=${id};`
	await db.query(updateExpense)

	console.log(await db.query(`SELECT approvalStatus FROM expense WHERE id=${id};`))
	return true
}
