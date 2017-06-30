const form = [
	{
		name: 'Image',
		type: 'file',
		value: 'charlie-card-landscape-mini.jpg'
	},

	{
		name: 'Points',
		type: 'file',
		value: 'charlie-card-landscape.points.json'
	},

	{
		name: 'Test',
		type: 'text',
		value: '213'
	}
]

const types = {
	'.json': 'application/json',
	'.jpg': 'image/jpeg'
}

// This code was adapted from a StackOverflow answer
// Credit: https://stackoverflow.com/questions/6164095

const fs = require('fs')
const http = require('http')
const path = require('path')

const config = {
	host: 'ec2-34-196-245-58.compute-1.amazonaws.com',
	port: '8080',
	path: '/MyaHealthAPI/healthcare/ImageUpload'
}

const makePartBoundary = () => {
	const randomNumbers = (Math.random() + '').split('.')[1]
	// return '--------------------------' + randomNumbers
	return '----------------------------984828130338131927001020'
}

const encodeFilePart = (boundary, type, name, filename) => {
	let returnPart = `--${boundary}\r\n`
	returnPart += `Content-Disposition: form-data; name="${name}"; filename="${filename}"\r\n`
	returnPart += `Content-Type: ${type}\r\n\r\n`
	return returnPart
}

const encodeFieldPart = (boundary, name, value) => {
	let returnPart = `--${boundary}\r\n`
	returnPart += `Content-Disposition: form-data; name="${name}"\r\n\r\n`
	returnPart += value + '\r\n'
	return returnPart
}

const makePostData = {
	file: (item, partBoundary) => {
		let filePostData = ''

		const filepath = path.join(__dirname, item.value)
		const extention = path.parse(filepath).ext
		const mimetype = types[extention]

		filePostData += encodeFilePart(partBoundary, mimetype, item.name, item.value)

		const fileData = fs.readFileSync(filepath, 'binary')

		filePostData += fileData
		filePostData += '\r\n'

		return filePostData
	},

	text: (item, partBoundary) => {
		let textPostData = ''

		textPostData += encodeFieldPart(partBoundary, item.name, item.value)

		return textPostData
	}
}

const post = () => new Promise((resolve, reject) => {
	let allPostData = ''

	const partBoundary = makePartBoundary()

	form.forEach(item => {
		if (Reflect.has(makePostData, item.type)) {
			const nextPostData = makePostData[item.type](item, partBoundary)
			allPostData += nextPostData
		}
	})

	allPostData += `--${partBoundary}--`

	const binaryPostData = Buffer.from(allPostData, 'binary')

	const options = {
		host: config.host,
		port: config.port,
		path: config.path,
		method: 'POST',
		headers: {
			'Content-Type': `multipart/form-data; boundary=${partBoundary}`,
			'Content-Length': binaryPostData.length
		}
	}

	const req = http.request(options, res => {
		res.setEncoding('utf8')

		let body = ''

		res.on('data', chunk => {
			body += chunk
		})

		res.on('end', () => {
			resolve(body)
		})

		res.on('close', () => {
			resolve(body)
		})

		res.on('error', err => {
			reject(err)
		})
	})

	req.write(binaryPostData)

	req.end()
})

post().then(data => {
	console.log('Closed request.')
	console.log(data)
})
.catch(err => {
	console.error(err)
})
