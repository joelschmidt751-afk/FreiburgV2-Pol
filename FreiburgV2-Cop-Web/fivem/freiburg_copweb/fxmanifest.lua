fx_version 'cerulean'
game 'gta5'
lua54 'yes'

author 'FreiburgV2 Community'
description 'FreiburgV2 Cop-Web ESX Legacy Bridge'
version '1.0.0'

shared_script 'config.lua'
server_scripts {
  '@oxmysql/lib/MySQL.lua',
  'server.lua'
}
dependency 'es_extended'
