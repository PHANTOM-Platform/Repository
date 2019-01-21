package repo_websocket;

import java.net.URI;
import java.net.URISyntaxException;
import org.java_websocket.client.WebSocketClient;
import org.java_websocket.handshake.ServerHandshake;
import org.java_websocket.exceptions.WebsocketNotConnectedException;

public class ws_susc_repository extends WebSocketClient {
	public ws_susc_repository(URI serverURI) {
		super( serverURI );
	}

	boolean connection_stablished =false;
	@Override
	public void onOpen( ServerHandshake handshakedata) {
		System.out.println("opened connection");
		connection_stablished=true;
		// if you plan to refuse connection based on ip or httpfields overload: onWebsocketHandshakeReceivedAsClient
	}

	@Override
	public void onMessage(String message) { // THIS FUNCTION WILL RUN FOR EACH RECEIVED MESSAGE
		System.out.println("received: " + message);
	}

	@Override
	public void onClose(int code, String reason, boolean remote) {
		// The codecodes are documented in class org.java_websocket.framing.CloseFrame
		System.out.println("Connection closed by " + (remote ? "remote peer" : "us" ) + " Code: " + code + " Reason: " + reason);
	}

	@Override
	public void onError(Exception ex) {
		ex.printStackTrace();
		// if the error is fatal then onClose will be called additionally
	}
	
	public static void main( String[] args ) throws URISyntaxException {
		String protocol = "ws";
		String host = "localhost";
		int port = 8000;
		String serverlocation = protocol + "://" + host + ":" + port + "/";
		WebSocketClient ws_client = null;
		try {
			ws_client = new ws_susc_repository( new URI(serverlocation)); // We create a WS connection
		} catch (URISyntaxException e){
			e.printStackTrace();
		}
		try {
			ws_client.connectBlocking();
 		} catch (InterruptedException exc) {
			exc.printStackTrace();
		}
		System.out.println("\nSUSCRIBE FOR CONTENTS IN PROJECT demo_hpc:");

		try {
			ws_client.send("{\"user\":\"alice@abc.com\", \"project\":\"demo_hpc\"}"); //user is for debugging purposes, it may help to find lost connections
			ws_client.send("{\"user\":\"alice@abc.com\", \"source\":\"PT\"}"); //user is for debugging purposes, it may help to find lost connections
		} catch (WebsocketNotConnectedException ex) {
			System.out.println("Websocket not connected: " + ex);
		}
	}
}
