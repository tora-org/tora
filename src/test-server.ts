import net from 'net'

const server = net.createServer((socket) => {
    socket.setTimeout(2000)
    socket.on('error', err => {
        console.log((err as any).code!, err)
    })
    socket.on('data', data => {
        // console.log(data.toString())
        if (socket.writable) {
            // console.log('writable')
            socket.write('world')
        }
    })
    socket.on('close', hadError => {
        console.log('event close', hadError)
    })
    socket.on('drain', () => {
        console.log('event drain')
        socket.end()
    })
    socket.on('end', () => {
        console.log('event end')
    })
    socket.on('timeout', () => {
        console.log('event timeout')
    })

})

server.on('error', (err) => {
    // Handle errors here.
    console.log('errrrrrrrrrr', err)
    // throw err
})

// Grab an arbitrary unused port.
server.listen(4098, () => {
    console.log('opened server on', server.address())
})
