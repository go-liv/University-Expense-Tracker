
/* manager.js */

import { customiseNavbar, file2DataURI, loadPage, secureGet, showMessage } from '../util.js'

export async function setup(node, userID = null) {
	console.log('Manager: setup')
	try {
		console.log(node)
        console.log(localStorage.getItem('authorization'))
		if(localStorage.getItem('authorization') === null) {
			loadPage('login')
			return
		}
		if(localStorage.getItem('role') !== "1") loadPage('home')
		
		customiseNavbar(['manager', 'logout'])
		
		const expenses = await loadExpenses(node)
        const users = await loadUserList(node, expenses.info)
        if(users.errors) {
            loadPage('login')
			return
        } else {
            if(node.querySelector('#expenseTable')) {
                await createExpenseList(node, expenses, userID)
            } else {
                await loadExpensesAwaiting(node, expenses)
                await createUserList(node, users, expenses)
            }
        }
	} catch(err) {
		console.error(err)
	}
}

async function loadExpenses(node) {
	console.log('Loading users expenses')
	const url = '/api/expenses'
	const options = {
		method: 'GET',
		headers: {
			'Content-Type': 'application/vnd.api+json',
			'Authorization': localStorage.getItem('authorization')
		}
	}
	const response = await fetch(url, options)
    if(response.status === 401) loadPage('login')
	const json = await response.json()

	return json
}

async function loadExpensesAwaiting(node, expenses) {
	let totalAmount = 0
	expenses.info.forEach( (result, i) => { totalAmount += expenses.info[i].amount })
	
	node.querySelector('#expensesNum').innerHTML = `<h3>Number of unapproved expenses:</h3> ${expenses.count[0].count}<br />`
	node.querySelector('#expensesAmount').innerHTML = `<h3>Totals to: </h3>\u00A3${totalAmount.toFixed(2)}<br />`
}

async function loadUserList(node, expenses) {
	console.log('Loading user list')
	const url = '/api/users'
	const options = {
		method: 'GET',
		headers: {
			'Content-Type': 'application/vnd.api+json',
			'Authorization': localStorage.getItem('authorization')
		}
	}
	const response = await fetch(url, options)
	if(response.status === 401) loadPage('login')
	const userObj = await response.json()
	
	return userObj
}

async function createUserList(node, userObj, expenses) {
	userObj.users.forEach( user => { 
		let userCount = 0
		let index = 0
		
		expenses.info.forEach( (expense, i) => {
			console.log(`${JSON.stringify(expense)} :: ${user.user}`)
			if (expense.user === user.user) {
				userCount += 1
			}
			index = i
		})
		node.querySelector('#users').innerHTML +=
		`<a href="/user-${user.user}"><img id="userImg" src="${user.avatar}" alt="Profile Picture" width="170" height="170" /></a>
		<p id="userInfo"><b> User: <a href="/user-${user.user}">${user.user}</a> <br /> Full Name: ${user.fullname} <br /> Total Unclaimed Expenses: ${userCount}</b></p>
		<br /><br />`
	})
}

async function approveExpense(event, id) {
	event.preventDefault()
	console.log(`approve id on loadExpenseDesc: ${event.currentTarget.expenseID}`)

	const url = `/api/expenses/${event.currentTarget.expenseID}`
	const options = {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/vnd.api+json',
			'Authorization': localStorage.getItem('authorization')
		},
		body: JSON.stringify({'change': 'approved'})
	}

	const response = await fetch(url, options)
	const json = await response.json()

	location.reload(); 
	return json
}

async function declineExpense(event) {
	event.preventDefault()
	console.log(`decline id on loadExpenseDesc: ${event.currentTarget.expenseID}`)

	const url = `/api/expenses/${event.currentTarget.expenseID}`
	const options = {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/vnd.api+json',
			'Authorization': localStorage.getItem('authorization')
		},
		body: JSON.stringify({'change': 'declined'})
	}

	const response = await fetch(url, options)
	const json = await response.json()
	
	location.reload();
	return json
}

async function createExpenseList(node, expenses, user) {
	let totalAmount = 0

	console.log(expenses.info)
	expenses.info.forEach( async(expense, ind) => {
		if (expense.user === user) {
			totalAmount += expenses.info[ind].amount
			/* We can use the index value to then iterate through 
			the expense response and load the correct id in the expense description page */
			node.querySelector('#expenseList').innerHTML += 
			`<tr>
				<td>${expense.currDate.split('T',1)}</td>
				<td>${expense.incDate.split('T',1)}</td>
				<td><a href="/expense-${ind}" id="${ind}">${expense.label}</a></td>
				<td>${expense.amount}</td>
				<button id="${ind}approve">Approve</button>
				<button id="${ind}decline">Decline</button>
			</tr>`
		}
	})

	expenses.info.forEach( async(expense, ind) => {
		if (expense.user === user) {
			const approve = node.getElementById(`${ind}approve`)
			const decline = node.getElementById(`${ind}decline`)
			approve.expenseID = expense.id
			decline.expenseID = expense.id
			approve.addEventListener('click', await approveExpense)
			decline.addEventListener('click', await declineExpense)
			console.log(approve)
			console.log(decline)
		}
	})

	node.querySelector('#expenseTotal').innerText = `Total expenses amount: \u00A3${totalAmount}`
}


