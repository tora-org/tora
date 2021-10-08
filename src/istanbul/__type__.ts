export interface MessageRequest {
    type: 'request'
    id: string
    task_name: string
    data: object
}

export interface MessageResponse {
    type: 'response'
    id: string
    data: object
}

export interface MessageHeartBeat {
    type: 'heart_beat'
    msg: string
}

export interface MessageError {
    type: 'response_error'
    id: string
    reason: string
}

export type Message =
    | MessageRequest
    | MessageResponse
    | MessageHeartBeat
    | MessageError

export type ParseCache = {
    type: Message['type']
    item_count: number
    item_parsed: Buffer[]
}
