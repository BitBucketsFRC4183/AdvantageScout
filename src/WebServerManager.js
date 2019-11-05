// Responsible for managing communication with the server on web
function WebServerManager(appManager) {
    var connected = true
    var connectedText = document.getElementById("onlinetext")
    
    // Start sending heartbeats regularly
    this.initHeartbeatLoop = function() {
        this.heartbeat()
        setInterval(function() {appManager.serverManager.heartbeat()}, 20000)
    }
    
    // Send heartbeat
    this.heartbeat = function() {
        const http = new XMLHttpRequest()
        
        http.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    connected = true
                    connectedText.style.color = "green"
                    connectedText.innerHTML = "Online"
                    appManager.serverManager.upload()
                } else {
                    connected = false
                    connectedText.style.color = "red"
                    connectedText.innerHTML = "Offline"
                    appManager.settingsManager.updateLocalCount()
                }
            }
        }
        
        http.timeout = 2000
        http.open("PUT", "/heartbeat", true)
        http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
        var teammatch = ""
        if (appManager.state >= 1 && appManager.state <= 3) {
            teammatch = "&team=" + appManager.team + "&match=" + appManager.match
        }
        http.send("device_name=" + encodeURI(window.localStorage.getItem("advantagescout_device")) + "&state=" + appManager.state.toString() + teammatch)
    }
    
    // Upload saved matches
    this.upload = function() {
        if (JSON.parse(window.localStorage.getItem("advantagescout_scoutdata")).length > 0) {
            const http = new XMLHttpRequest()
            
            http.onreadystatechange = function() {
                if (this.readyState == 4) {
                    if (this.status == 200) {
                        var response = JSON.parse(this.responseText)
                        if (response.success) {
                            var stored = JSON.parse(window.localStorage.getItem("advantagescout_scoutdata"))
                            stored.splice(0, response.count)
                            window.localStorage.setItem("advantagescout_scoutdata", JSON.stringify(stored))
                        }
                    }
                    appManager.settingsManager.updateLocalCount()
                }
            }
            
            http.onabort = function() {
                appManager.settingsManager.updateLocalCount()
            }
            http.onerror = function() {
                appManager.settingsManager.updateLocalCount()
            }
            
            http.timeout = 2000
            http.open("POST", "/upload", true)
            http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
            http.send("data=" + encodeURI(window.localStorage.getItem("advantagescout_scoutdata")))
        } else {
            appManager.settingsManager.updateLocalCount()
        }
    }
    
    // Get config and game data
    this.getData = function() {
        const configHttp = new XMLHttpRequest()
        
        configHttp.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    var configTemp = this.responseText
                    const gameHttp = new XMLHttpRequest()
                    
                    gameHttp.onreadystatechange = function() {
                        if (this.readyState == 4) {
                            if (this.status == 200) {
                                appManager.loadData(JSON.parse(configTemp), JSON.parse(this.responseText), "", false)
                            } else {
                                appManager.notificationManager.alert("Error", "Failed to retrieve game data")
                            }
                        }
                    }
                    
                    gameHttp.open("GET", "/load_game", true)
                    gameHttp.send()
                    
                } else {
                    appManager.notificationManager.alert("Error", "Failed to retrieve configuration data")
                }
            }
        }
        
        configHttp.open("GET", "/get_config", true)
        configHttp.send()
    }
    
    // Report if connected to server
    this.connected = function() {
        return connected
    }
}