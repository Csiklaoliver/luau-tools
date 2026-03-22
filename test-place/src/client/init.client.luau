-- Client entry point
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local GameConfig = require(ReplicatedStorage.Shared.GameConfig)

local localPlayer = Players.LocalPlayer
local character = localPlayer.Character or localPlayer.CharacterAdded:Wait()

print(`[Client] Ready — WalkSpeed cap: {GameConfig.WALK_SPEED}`)

-- Re-apply on respawn
localPlayer.CharacterAdded:Connect(function(newCharacter)
	character = newCharacter
	print(`[Client] Character respawned`)
end)
