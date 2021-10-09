let asciiChars = null

const base64ToStr = (data) => {
    return Buffer.from(data, 'base64').toString()
}

const strToBase64 = (data) => {
    return Buffer.from(data).toString('base64')
}

// Wrap promises so you don't have to try catch each you do promise or async/await
// just wrapper that return [response, null] on resolved
// and [null, error] on reject or error
const promiseWrapper = async (promise) => {
    const data = [null, null]

    try {
        data[0] = await promise
    } catch (error) {
        data[1] = error
    }

    return data
} 

const isExpired = (dateStr) => {
    const expirationDate = new Date(dateStr)
    return Date.now() >= expirationDate.getTime()
} 

const getAsciiChars = () => {
    if(asciiChars && asciiChars.length >= 26 * 2 + 10) return asciiChars

    const chars = []

    for(let i = 0; i < 26 ; i++) {
        chars.push(String.fromCharCode(i + 97))
        chars.push(String.fromCharCode(i + 65))
    }

    for(let i = 0; i < 10; i++) {
        chars.push(i.toString())
    }

    asciiChars = [...chars]
    return chars
}

const randomStr = (len = 25) => {
    const allowedChars = getAsciiChars()

    return new Array(len).fill(0).map(() => {
        const index = Math.round(Math.random() * allowedChars.length)
        return allowedChars[index]
    }).join('')
}

const isTruthy = (a) => a !== null && a !== undefined && a !== ''

module.exports = {
    base64ToStr,
    promiseWrapper,
    strToBase64,
    isExpired,
    randomStr,
    isTruthy
}