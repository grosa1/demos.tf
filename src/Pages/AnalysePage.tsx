import * as React from 'react';

import {DemoDropZone} from '../Components/Dropzone';
import {Analyser} from '../Analyse/Analyser';
import {ParsedDemo, Header} from "@demostf/parser-worker";

import './AboutPage.css';
import {DemoProvider} from "../Providers/DemoProvider";
import Spinner from 'react-spinner';
import {AsyncParser} from "../Analyse/Data/AsyncParser";

export interface AnalysePageState {
	demoFile: File | null;
	demo: ParsedDemo | null;
	header: Header | null;
	loading: boolean;
	error?: string;
	parser: AsyncParser | null;
	progress: number;
	downloadProgress: number,
	current: string,
}

export interface AnalysePageProps {
	match: {
		id?: string;
	}
}

import "./AnalysePage.css";

export default class AnalysePage extends React.Component<AnalysePageProps, AnalysePageState> {
	static page = 'analyse';
	provider: DemoProvider = DemoProvider.instance;

	state: AnalysePageState = {
		demoFile: null,
		demo: null,
		header: null,
		loading: false,
		parser: null,
		current: "Downloading demo",
		downloadProgress: 0,
		progress: 0
	};

	onDrop([demoFile]) {
		this.setState({demoFile, loading: true});
		const reader = new FileReader();
		reader.onload = () => {
			const buffer = reader.result as ArrayBuffer;
			this.handleBuffer(buffer);
		};
		reader.readAsArrayBuffer(demoFile);
	}

	handleBuffer(buffer: ArrayBuffer) {
		this.setState({current: "Processing demo"});
		try {
			const parser = new AsyncParser(buffer, (progress) => {
				this.setState({progress});
			});
			parser.cache().then((demo) => {
				this.setState({
					header: parser.demo.header,
					loading: false,
					parser
				});
			}, (error) => {
				this.setState({error});
			});
		} catch (e) {
			this.setState({error: e.message});
		}
	}

	componentDidMount() {
		document.title = "Viewer - demos.tf";
		if (this.props.match.id) {
			this.setState({loading: true});
			this.provider.getDemo(parseInt(this.props.match.id, 10)).then((demo) => {
				return demo.url;
			}).then((url) => {
				return fetch(url, {mode: 'cors'});
			}).then((response) => {
				return readBuffer(response, (downloadProgress) => {
					this.setState({downloadProgress})
				});
			}).then((buffer) => {
				this.handleBuffer(buffer)
			});
		}
	}

	isSupported() {
		return ('Uint8Array' in window);
	}

	render() {
		if (this.state.error) {
			return <div className="error-holder">
				<div className="error-image">Something broke...</div>
				<div className="error">
					{this.state.error}
					<div className="error-hint">
						You can report issues on <a
						href="https://github.com/demostf/demos.tf/issues">github</a>.
					</div>
				</div>
			</div>;
		}

		if (this.state.loading) {
			return <div className="analyse-progress">
				<p>
					{this.state.current}...
				</p>
				<Spinner/>
				<progress max={100} value={this.state.downloadProgress}/>
				<progress max={100} value={this.state.progress}/>
			</div>;
		}

		return (
			<div className="analyse-page">
				<p className="page-note">
					To view a demo, select a file on your computer or use the "View" button on any demo stored on the
					site.
				</p>
				{(this.state.header === null || this.state.parser === null) ?
					<DemoDropZone onDrop={this.onDrop.bind(this)}
								  text="Drop file or click to select"/> :
					<Analyser header={this.state.header}
							  isStored={!!this.props.match.id}
							  parser={this.state.parser}
					/>
				}
			</div>
		);
	}
}

async function readBuffer(response: Response, progress: (progress: number) => void): Promise<ArrayBuffer> {
	if (!response.body || !response.headers) {
		throw new Error("invalid response");
	}
	const contentLength = +(response.headers.get('Content-Length') || 0);
	let receivedLength = 0;

	let data = new Uint8Array(contentLength);

	const reader = response.body.getReader();

	while(true) {
		const {done, value} = await reader.read();

		if (done) {
			break;
		}

		data.set(value, receivedLength);
		receivedLength += value.length;

		progress((receivedLength / contentLength) * 100);
	}

	return data.buffer;
}
