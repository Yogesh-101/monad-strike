// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title WeaponNFT
 * @notice ERC-1155 weapon tokens for MonadStrike.
 *         tokenId maps 1:1 to weapon type — minted on purchase, burned on round end,
 *         transferable for weapon drops between players.
 *
 *         Token IDs:
 *           0 = Glock, 1 = Desert Eagle, 2 = MP5, 3 = AK-47,
 *           4 = AWP, 5 = HE Grenade, 6 = Armor
 */
contract WeaponNFT is ERC1155, Ownable {

    // ── State ────────────────────────────────────────────────────────────
    /// @notice Only the GameEconomy contract may mint / burn
    address public authorizedCaller;

    uint8 public constant TOTAL_WEAPONS = 7;

    // Human-readable names stored on-chain for convenience
    mapping(uint256 => string) private _weaponNames;

    // ── Events ───────────────────────────────────────────────────────────
    event AuthorizedCallerSet(address indexed caller);
    event WeaponMinted(address indexed to, uint256 indexed tokenId, uint256 amount);
    event WeaponBurned(address indexed from, uint256 indexed tokenId, uint256 amount);

    // ── Errors ───────────────────────────────────────────────────────────
    error NotAuthorized();
    error InvalidWeaponId(uint256 id);

    // ── Modifiers ────────────────────────────────────────────────────────
    modifier onlyAuthorized() {
        if (msg.sender != authorizedCaller && msg.sender != owner()) revert NotAuthorized();
        _;
    }

    modifier validWeapon(uint256 tokenId) {
        if (tokenId >= TOTAL_WEAPONS) revert InvalidWeaponId(tokenId);
        _;
    }

    // ── Constructor ──────────────────────────────────────────────────────
    constructor()
        ERC1155("https://monadstrike.gg/api/weapon/{id}.json")
        Ownable(msg.sender)
    {
        _weaponNames[0] = "Glock";
        _weaponNames[1] = "Desert Eagle";
        _weaponNames[2] = "MP5";
        _weaponNames[3] = "AK-47";
        _weaponNames[4] = "AWP";
        _weaponNames[5] = "HE Grenade";
        _weaponNames[6] = "Armor";
    }

    // ── Admin ────────────────────────────────────────────────────────────

    /// @notice Set the GameEconomy contract as the only address that can mint/burn
    function setAuthorizedCaller(address _caller) external onlyOwner {
        authorizedCaller = _caller;
        emit AuthorizedCallerSet(_caller);
    }

    /// @notice Update the base URI for token metadata
    function setURI(string memory newuri) external onlyOwner {
        _setURI(newuri);
    }

    // ── Minting / Burning ────────────────────────────────────────────────

    /// @notice Mint a weapon token to a player (called by GameEconomy on purchase)
    function mint(
        address to,
        uint256 tokenId,
        uint256 amount
    ) external onlyAuthorized validWeapon(tokenId) {
        _mint(to, tokenId, amount, "");
        emit WeaponMinted(to, tokenId, amount);
    }

    /// @notice Mint a batch of weapons in one call
    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts
    ) external onlyAuthorized {
        for (uint256 i = 0; i < ids.length; i++) {
            if (ids[i] >= TOTAL_WEAPONS) revert InvalidWeaponId(ids[i]);
        }
        _mintBatch(to, ids, amounts, "");
    }

    /// @notice Burn weapons at round end
    function burn(
        address from,
        uint256 tokenId,
        uint256 amount
    ) external onlyAuthorized validWeapon(tokenId) {
        _burn(from, tokenId, amount);
        emit WeaponBurned(from, tokenId, amount);
    }

    /// @notice Burn a batch of weapons at round end
    function burnBatch(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts
    ) external onlyAuthorized {
        _burnBatch(from, ids, amounts);
    }

    // ── Views ────────────────────────────────────────────────────────────

    /// @notice Get the name of a weapon by ID
    function weaponName(uint256 tokenId) external view validWeapon(tokenId) returns (string memory) {
        return _weaponNames[tokenId];
    }

    /// @notice Get all weapon balances for a player
    function getLoadout(address player) external view returns (uint256[] memory) {
        uint256[] memory balances = new uint256[](TOTAL_WEAPONS);
        for (uint8 i = 0; i < TOTAL_WEAPONS; i++) {
            balances[i] = balanceOf(player, i);
        }
        return balances;
    }
}
