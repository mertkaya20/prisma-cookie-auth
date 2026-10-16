import { server } from "./server.js";
import { config } from "./shared/config.js";

server.listen(config.port, () => {
  console.log(`Server is running on PORT ${config.port}`);
});
