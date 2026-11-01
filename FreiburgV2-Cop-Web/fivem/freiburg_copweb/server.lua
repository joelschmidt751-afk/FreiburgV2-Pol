local ESX = exports['es_extended']:getSharedObject()

local function sendEvent(eventType, payload)
    if Config.ApiUrl == '' or Config.ApiKey == '' then
        print('^3[freiburg_copweb]^7 API-URL oder API-Key fehlt; Ereignis wurde nicht gesendet.')
        return
    end
    PerformHttpRequest(Config.ApiUrl .. '/api/fivem/event', function(status, body)
        if status < 200 or status >= 300 then
            print(('[freiburg_copweb] API-Anfrage fehlgeschlagen (HTTP %s)'):format(status))
        end
    end, 'POST', json.encode({ type = eventType, payload = payload or {} }), {
        ['Content-Type'] = 'application/json',
        ['x-freiburg-api-key'] = Config.ApiKey
    })
end

if Config.SendPlayerJoinEvents then
    AddEventHandler('esx:playerLoaded', function(playerId, xPlayer)
        -- Nur minimale RP-Telemetrie; keine Kennwörter oder sensiblen Daten übertragen.
        sendEvent('player.loaded', {
            source = tonumber(playerId),
            job = xPlayer and xPlayer.job and xPlayer.job.name or 'unknown'
        })
    end)
end

RegisterCommand('copwebtest', function(source)
    if source ~= 0 then
        print(('^3[freiburg_copweb]^7 Testkommando nur über Serverkonsole nutzen.'))
        return
    end
    sendEvent('bridge.test', { resource = GetCurrentResourceName() })
    print('^2[freiburg_copweb]^7 Testereignis an Cop-Web gesendet.')
end, true)
