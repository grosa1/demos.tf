import {
	Demo, Header, Packet, Player, UserInfo,
	Match, World
} from 'tf2-demo/build/es6';
import {PositionCache, Point} from './PositionCache';
import {getMapBoundaries} from "../MapBoundries";
import {HealthCache} from "./HealthCache";
import {PlayerMetaCache} from "./PlayerMetaCache";
import {ViewAngleCache} from "./ViewAngleCache";
import {LifeState} from "tf2-demo/build/es6/Data/Player";
import {Death} from "tf2-demo/build/es6/Data/Death";
import {killAlias} from "../Render/killAlias";
import {PlayerCache} from "./PlayerCache";
import {BuildingCache, CachedBuilding} from "./BuildingCache";
import {Building} from "tf2-demo/build/Data/Building";

export class CachedPlayer {
	position: Point;
	user: UserInfo;
	health: number;
	teamId: number;
	classId: number;
	team: string;
	viewAngle: number;
}

export interface CachedDeath {
	tick: number;
	victim: Player;
	assister: Player|null;
	killer: Player|null;
	weapon: string;
	victimTeam: number;
	assisterTeam: number;
	killerTeam: number;
}

export interface CachedDemo {
	header: Header;
	playerCache: PlayerCache;
	ticks: number;
	deaths: {[tick: string]: CachedDeath[]};
	buildingCache: BuildingCache;
	intervalPerTick: number;
	world: World;
	nextMappedPlayer: number;
	entityPlayerMap: {[playerId: string]: Player};
	now: number;
}

export class AsyncParser {
	buffer: ArrayBuffer;
	demo: Demo;
	header: Header;
	playerCache: PlayerCache;
	nextMappedPlayer = 0;
	entityPlayerMap: {[playerId: string]: Player} = {};
	ticks: number;
	match: Match;
	deaths: {[tick: string]: CachedDeath[]} = {};
	buildingCache: BuildingCache;
	intervalPerTick: number;
	world: World;

	constructor(bufffer: ArrayBuffer) {
		this.buffer = bufffer;
	}

	cache(): Promise<void> {
		return this.getCachedData().then((cachedData: CachedDemo) => {
			this.ticks = cachedData.ticks;
			this.header = cachedData.header;
			this.playerCache = cachedData.playerCache;
			this.buildingCache = cachedData.buildingCache;
			this.deaths = cachedData.deaths;
			this.intervalPerTick = cachedData.intervalPerTick;
			this.world = cachedData.world;
			this.nextMappedPlayer = cachedData.nextMappedPlayer;
			this.entityPlayerMap = cachedData.entityPlayerMap;
		});
	}

	getCachedData(): Promise<CachedDemo> {
		return new Promise((resolve, reject) => {
			const Worker = require("worker-loader!./ParseWorker");
			const worker = new Worker;
			worker.postMessage({
				buffer: this.buffer
			}, [this.buffer]);
			worker.onmessage = (event) => {
				if (event.data.error) {
					reject(new Error(event.data.error));
				}
				const cachedData: CachedDemo = event.data;
				BuildingCache.rehydrate(cachedData.buildingCache);
				PlayerCache.rehydrate(cachedData.playerCache);
				resolve(event.data);
			}
		});
	}

	getPlayersAtTick(tick: number) {
		const players: CachedPlayer[] = [];
		for (let i = 0; i < this.nextMappedPlayer; i++) {
			players.push(this.playerCache.getPlayer(tick, i, this.entityPlayerMap[i].user));
		}
		return players;
	}

	getBuildingAtTick(tick: number): CachedBuilding[] {
		return this.buildingCache.getBuildings(tick);
	}
}