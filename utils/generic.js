const base64ToStr = (data) => {
    return Buffer.from(data, 'base64').toString()
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

module.exports = {
    base64ToStr,
    promiseWrapper
}