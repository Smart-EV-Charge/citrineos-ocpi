# SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
#
# SPDX-License-Identifier: Apache-2.0

http-server /tmp/everest_ocpp_logs -p 8888 &

if [ "$OCPP_VERSION" = "one" ]; then
	chmod +x /ext/source/build/run-scripts/run-sil-ocpp.sh
	sed -i "0,/127.0.0.1:8180\/steve\/websocket\/CentralSystemService\// s|127.0.0.1:8180/steve/websocket/CentralSystemService/|${EVEREST_TARGET_URL}|" /ext/source/build/dist/share/everest/modules/OCPP/config-docker.json
	/ext/source/build/run-scripts/run-sil-ocpp.sh
else
	if [ "$EVEREST_ENABLE_PNC" = "true" ]; then
		chmod +x /ext/source/build/run-scripts/run-sil-ocpp201-pnc.sh
		/ext/source/build/run-scripts/run-sil-ocpp201-pnc.sh
	else
		chmod +x /ext/source/build/run-scripts/run-sil-ocpp201.sh
		/ext/source/build/run-scripts/run-sil-ocpp201.sh
	fi
fi