import * as React from 'react';
import {CachedPlayer} from "../Data/Parser";

export interface PlayerSpecProps {
	player: CachedPlayer;
}

import './PlayerSpec.css';

const healthMap = {
	1: 125,//scout
	2: 150,//sniper
	3: 200,//soldier,
	4: 175,//demoman,
	5: 150,//medic,
	6: 300,//heavy,
	7: 175,//pyro
	8: 125,//spy
	9: 125,//engineer
};

const classMap = {
	1: "scout",
	2: "sniper",
	3: "soldier",
	4: "demoman",
	5: "medic",
	6: "heavy",
	7: "pyro",
	8: "spy",
	9: "engineer"
};

export interface PlayersSpecProps {
	players: CachedPlayer[];
}

export function PlayersSpec({players}:PlayersSpecProps) {
	const redPlayerSpecs = players
		.filter((player) => player.teamId === 2)
		.map((player, i) => <PlayerSpec key={i} player={player}/>);
	const bluePlayerSpecs = players
		.filter((player) => player.teamId === 3)
		.map((player, i) => <PlayerSpec key={i} player={player}/>);

	return (<div>
		<div className="redSpecHolder">{redPlayerSpecs}</div>
		<div className="blueSpecHolder">{bluePlayerSpecs}</div>
	</div>);
}

export function PlayerSpec({player}:PlayerSpecProps) {
	const healthPercent = Math.min(100, player.health / healthMap[player.classId] * 100);
	const healthStatusClass = (player.health > healthMap[player.classId]) ? 'overhealed' : (player.health <= 0 ? 'dead' : '');
	return (
		<div className={"playerspec " + player.team + " " + healthStatusClass}>
			<div className={classMap[player.classId] + " class-icon"}/>
			<div className="health-container">
				<div className="healthbar"
				     style={{width: healthPercent + '%'}}/>
				<span className="player-name">{player.user.name}</span>
				<span className="health">{player.health}</span>
			</div>
		</div>
	);
}
