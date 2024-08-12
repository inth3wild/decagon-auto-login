import axios from "axios";
import "dotenv/config";

type getDateReturn = {
  hour: number;
  minutes: number;
  year: number;
  month: string;
  day: number;
  AM_OR_PM: "AM" | "PM";
};

const axiosInstance = axios.create({
  baseURL: process.env.BASE_URL,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0",
  },
});

// Get current date
function getDate(): getDateReturn {
  const date = new Date();
  const hour = date.getHours() > 12 ? date.getHours() - 12 : date.getHours();
  const minutes = date.getMinutes();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = date.getDate();
  const AM_OR_PM = date.getHours() > 12 ? "PM" : "AM";
  return { hour, minutes, year, month, day, AM_OR_PM };
}

// Sends request to login
async function login(): Promise<void> {
  try {
    const response = await axiosInstance.post(
      "/rest-api/oauth/access_token",
      {
        grant_type: "password",
        client_id: "TalentPlus",
        client_secret: process.env.CLIENT_SECRET,
        username: process.env.USERNAME,
        password: process.env.PASSWORD,
      },
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const accessToken = response.data.access_token;

    // Get current date
    const currentDate = getDate();

    // Call getPoints()
    const points = await getPoints(accessToken);

    // Send slack notification
    await sendSlackNotification(points as number, currentDate);
  } catch (error: any) {
    console.error("Login error: ", error);
  }
}

// Sends request to get my points
async function getPoints(accessToken: string): Promise<number | void> {
  try {
    const response = await axiosInstance.get("/rest-api/v1/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log(response.data["_data"].points);
    return response.data["_data"].points;
  } catch (error: any) {
    console.error("Get points error: ", error);
    return;
  }
}

// Sends slack notification
async function sendSlackNotification(
  points: number,
  currentDate: getDateReturn
) {
  const { hour, minutes, AM_OR_PM, year, month, day } = currentDate;
  try {
    await axiosInstance.post(
      process.env.SLACK_WEBHOOK_URL!,
      {
        text: `
        Logged in at ${hour}:${minutes} ${AM_OR_PM} on ${year}-${month}-${day}.\nTotal points: ${points}
        `,
      },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Send notification error: ", error);
  }
}

// Start the script
export default async function main() {
  await login();
}
main();
