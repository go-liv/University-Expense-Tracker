
/* addExpense.js */

import { customiseNavbar, file2DataURI, loadPage, secureGet, showMessage, uploadImage } from '../util.js'

export async function setup(node) {
	console.log('Add Expense: setup')
	try {
		console.log(node)
		customiseNavbar(['home', 'logout'])
		if(localStorage.getItem('authorization') === null) loadPage('login')
        // Waiting for user expense form submission
		node.querySelector('form').addEventListener('submit', await logExpense)
	} catch(err) {
		console.error(err)
	}
}

// Send the expense form in the body of a POST request to add expense to db
async function logExpense(event) {
	console.log('func UPLOAD EXPENSE TO DB')
	event.preventDefault()
	// Gather information from the expense form
	const element = document.querySelector('form')
	const data = new FormData(element)
	const user = localStorage.getItem('username')

	const description = document.querySelector('textarea').value
	
	// Transform the file in a DataURI to be stored in the db
	const receipt = await file2DataURI(data.get('receipt'))

    const url = '/api/expenses'
	const options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/vnd.api+json',
			'Authorization': localStorage.getItem('authorization')
		},
		body: JSON.stringify({
			'receipt': receipt,
			'user': user,
			'incDate': data.get('date'),
			'category': data.get('categories'),
			'label': data.get('label'),
			'amount': data.get('amount'),
			'description': description
		})
	}
	const response = await fetch(url, options)
	const json = await response.json()

	if(response.status === 400) {
		showMessage('Form not well filled.')
		loadPage('addExpense')
	} else {
		showMessage('expense uploaded')
		loadPage('home')
	}
}