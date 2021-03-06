package demo_phantom;
// This Java Class should return the TOKEN-string generated by the PHANTOM Repository for a specific user_id and user_pw
//
// Author: J.M.Montañana HLRS 2018
// If you find any bug, please notify to hpcjmont@hlrs.de
// 
// Copyright (C) 2018 University of Stuttgart
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
// 	http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import java.io.BufferedReader;
import java.io.DataOutputStream; 
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

import static org.apache.http.HttpHeaders.USER_AGENT;

public class get_token {
	public static String request_repository_server(String table_ini, String mfserveraddress, String mfserverport ) throws IOException {
		String table=table_ini.replaceAll(" ","%20");
		String retmonmetric = new String();
		String urlString = new String();
		String responsestring = new String();
		int cnt=0;
		urlString = "http://"+mfserveraddress+":"+mfserverport+table;
// 		System.out.println(ConsoleColors.GREEN_BRIGHT+"\nGET request to Repository using the url: "+urlString+ConsoleColors.RESET);
		URL httpurl = new URL(urlString);
		HttpURLConnection c = (HttpURLConnection)httpurl.openConnection();//connecting to url
		c.setRequestProperty( "Content-type", "application/x-www-form-urlencoded");
		c.setRequestProperty( "Accept", "*/*" );
		c.setRequestMethod("GET"); 
		BufferedReader in = new BufferedReader(new InputStreamReader(c.getInputStream()));//stream to resource
		String str;
		while ((str = in.readLine()) != null){ //reading data
			responsestring += str+"\n";//process the response and save it in some string or so
			cnt++;
		}
		in.close();//closing stream
		c.disconnect();
		return responsestring;
	}

	public static void main(String[] args) throws IOException { 
		int firstArg;
		if (args.length > 1) {
			String user_id=args[0];
			String user_pw = args[1];
			String mfserveraddress= args[2];
			String mfserverport= args[3];
			String responsestring = request_repository_server("/login?email="+user_id+"&pw="+user_pw, mfserveraddress, mfserverport);
			System.out.println(responsestring); //it returns the string token.
		}else{
			System.err.println("Missing arguments, please try: \n get_token user_id user_pw\n");
			System.exit(1);
		}
	}
}
