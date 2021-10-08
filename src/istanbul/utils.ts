import zlib from 'zlib'

export async function deflate(data: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        zlib.deflate(data, (error, result) => {
            error ? reject(error) : resolve(result)
        })
    })
}

export async function inflate(data: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        zlib.inflate(data, (error, result) => {
            error ? reject(error) : resolve(result)
        })
    })
}
