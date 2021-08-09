exports.front_url = "http://localhost:3000"
exports.self_url = "http://localhost:3001"
exports.steam_api_key = "F7EB8B5146C0C2B2A62B1B03EDDC8120"
exports.randomorg_api_key = "a9bec6be-5741-407a-be4f-06bbc7e31990"

exports.containsId = (array, id) => {
    let contains = false
    array.forEach(element => {
        if (element._id == id || element.id == id) contains = true
    })
    return contains
}

exports.haveItem = (array, item) => {
    let have = true
    array.forEach(el => {
        if (el != item) return have = false
    })
}

/*exports.haveItems = (array, items) => {
    let haveall = true
    for (let i = 0; i < items.length; i++) {
        let haveitem =
        for (let j = 0; j < array.length; j++) {
            if (array[j] == items[i]) {
                array[j] =
                }
        }
    }
}*/