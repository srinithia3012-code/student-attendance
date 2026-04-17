import app from "./app";
import { startStaffAutoAbsentService } from "./services/staffAutoAbsentService";
import { verifyDatabaseConnection } from "./db/client";

const PORT = process.env.PORT || 5000;

async function main(): Promise<void> {
  await verifyDatabaseConnection();
  startStaffAutoAbsentService();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

main().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
