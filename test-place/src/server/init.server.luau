-- Server entry point
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local GameConfig = require(ReplicatedStorage.Shared.GameConfig)

local function onPlayerAdded(player: Player)
	print(`[Server] {player.Name} joined`)

	local character = player.Character or player.CharacterAdded:Wait()
	local humanoid = character:WaitForChild("Humanoid") :: Humanoid

	humanoid.WalkSpeed = GameConfig.WALK_SPEED
	humanoid.JumpPower = GameConfig.JUMP_POWER
	humanoid.MaxHealth = GameConfig.MAX_HEALTH
	humanoid.Health = GameConfig.MAX_HEALTH
end

local function onPlayerRemoving(player: Player)
	print(`[Server] {player.Name} left`)
end

Players.PlayerAdded:Connect(onPlayerAdded)
Players.PlayerRemoving:Connect(onPlayerRemoving)

-- Handle players who joined before this script ran (Studio play test)
for _, player in Players:GetPlayers() do
	task.spawn(onPlayerAdded, player)
end
