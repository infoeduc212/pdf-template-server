export default function concatenateStreamIntoBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const arr: Uint8Array[] = []
        stream.on('data', data => {
            arr.push(data)
        })
        stream.on('end', () => {
            resolve(Buffer.concat(arr))
        })
        stream.on('error', err => {
            reject(err)
        })
    })
}