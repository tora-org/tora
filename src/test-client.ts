import net from 'net'

const socket = net.createConnection({
    port: 4098,
    host: 'poi',
    timeout: 1000
}, () => {
    // 'connect' listener.
    console.log('connected to server!')
    socket.write('Hello')
    socket.end(() => {
        // socket.unref()
        // socket.write('lkj')
    })
        socket.destroy()
    // socket.end()
    // socket.end()
    // socket.unref()
})

socket.on('error', err => {
    console.log('oeoeoeoeoeoeoeoe', err)
})

socket.on('data', data => {
    console.log(data.toString())
    setTimeout(() => {
        if (socket.writable) {
            socket.write('Hello')
        }
    }, 200)
})

socket.on('connect', () => {
    console.log('event connect')
})
socket.on('drain', () => {
    console.log('event drain')
    socket.end()
})
socket.on('end', () => {
    console.log('event end')
})
socket.on('ready', () => {
    console.log('event ready')
})
socket.on('timeout', () => {
    console.log('event timeout')
})
