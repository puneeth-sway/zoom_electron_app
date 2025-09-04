const { ipcRenderer } = require("electron");

// Import Zoom Video SDK with proper error handling
let ZoomVideo;

async function loadZoomSDK() {
  try {
    // Check if we're in a browser-like environment
    if (typeof window === "undefined" || typeof navigator === "undefined") {
      throw new Error("Not in browser environment");
    }

    // Try CommonJS require first
    try {
      ZoomVideo = require("@zoom/videosdk");
      console.log("Zoom Video SDK loaded via require");
      console.log("ZoomVideo object type:", typeof ZoomVideo);
      console.log("ZoomVideo object keys:", Object.keys(ZoomVideo));

      // Check if it has createClient method
      if (typeof ZoomVideo.createClient === "function") {
        console.log("✅ createClient method found directly");
      } else if (
        ZoomVideo.default &&
        typeof ZoomVideo.default.createClient === "function"
      ) {
        console.log("✅ createClient method found in default export");
      } else {
        console.log("⚠️  createClient method not found in expected location");
      }

      return true;
    } catch (requireError) {
      console.log("Require failed, trying dynamic import...");

      try {
        // Try dynamic import as fallback
        const module = await import("@zoom/videosdk");
        ZoomVideo = module.default || module;
        console.log("Zoom Video SDK loaded via dynamic import");
        console.log("ZoomVideo object type:", typeof ZoomVideo);
        console.log("ZoomVideo object keys:", Object.keys(ZoomVideo));
        return true;
      } catch (importError) {
        console.error("Dynamic import also failed:", importError);
        throw importError;
      }
    }
  } catch (error) {
    console.error("Failed to load Zoom Video SDK:", error);
    return false;
  }
}

// Initialize Zoom SDK loading when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  loadZoomSDK().then((success) => {
    if (!success) {
      console.error("Failed to load Zoom Video SDK via all methods");
    }
  });
});

class VideoCallApp {
  constructor() {
    this.client = null;
    this.currentSession = null;
    this.currentUserName = "";
    this.currentUserRole = 1; // 1 = Presenter, 0 = Audience
    this.isAudioMuted = false;
    this.isVideoMuted = false;
    this.isScreenSharing = false;
    this.participants = new Map();
    this.videoContainer = null;
    this.chatMessages = [];
    this.presenterUserId = null; // Track who the presenter is

    // Background change properties
    this.backgroundProcessor = null;
    this.currentBackground = "none";
    this.customBackgroundImage = null;
    this.isChangingBackground = false; // Flag to prevent duplicate video rendering
    this.videoEventListenersDisabled = false; // Flag to disable video event listeners

    this.initializeApp();
  }

  initializeApp() {
    this.videoContainer = document.getElementById("video-container");
    this.setupEventListeners();
    this.checkZoomSDKAvailability();
    this.showScreen("home-screen");
  }

  checkZoomSDKAvailability() {
    if (!ZoomVideo) {
      console.error("Zoom Video SDK not available");
      this.showSDKError();
    } else if (typeof ZoomVideo.createClient !== "function") {
      console.error("Zoom Video SDK createClient method not found");
      this.showSDKError();
    }
  }

  showSDKError() {
    // Add error message to the home screen
    const errorDiv = document.createElement("div");
    errorDiv.className = "sdk-error";
    errorDiv.innerHTML = `
      <div style="background: #ff6b6b; color: white; padding: 1rem; border-radius: 10px; margin: 1rem 0;">
        <h3>⚠️ Zoom Video SDK Error</h3>
        <p>The Zoom Video SDK could not be loaded properly. Please ensure:</p>
        <ul style="text-align: left; margin: 1rem 0;">
          <li>You have run <code>npm install</code></li>
          <li>The @zoom/videosdk package is properly installed</li>
          <li>You have valid Zoom Video SDK credentials</li>
        </ul>
        <button onclick="location.reload()" style="background: white; color: #ff6b6b; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;">
          Reload Application
        </button>
      </div>
    `;

    const container = document.querySelector(".container");
    if (container) {
      container.appendChild(errorDiv);
    }
  }

  setupEventListeners() {
    // Home screen events
    document
      .getElementById("join-btn")
      .addEventListener("click", () => this.joinMeeting());
    document
      .getElementById("create-btn")
      .addEventListener("click", () => this.createMeeting());

    // Video call control events
    document
      .getElementById("mute-audio")
      .addEventListener("click", () => this.toggleAudio());
    document
      .getElementById("mute-video")
      .addEventListener("click", () => this.toggleVideo());
    document
      .getElementById("screen-share")
      .addEventListener("click", () => this.toggleScreenShare());
    document
      .getElementById("leave-meeting")
      .addEventListener("click", () => this.leaveMeeting());
    document
      .getElementById("chat-btn")
      .addEventListener("click", () => this.toggleChat());

    // Chat events
    document
      .getElementById("close-chat")
      .addEventListener("click", () => this.toggleChat());
    document
      .getElementById("send-chat")
      .addEventListener("click", () => this.sendChatMessage());
    document.getElementById("chat-input").addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.sendChatMessage();
    });

    // Background control events (Presenter only)
    document
      .getElementById("background-btn")
      .addEventListener("click", () => this.showBackgroundModal());
    document
      .getElementById("blur-btn")
      .addEventListener("click", () => this.applyBlurBackground());
    document
      .getElementById("remove-bg-btn")
      .addEventListener("click", () => this.removeBackground());
    document
      .getElementById("close-bg-modal")
      .addEventListener("click", () => this.hideBackgroundModal());

    // Background modal events
    document.querySelectorAll(".background-option").forEach((option) => {
      option.addEventListener("click", () =>
        this.selectBackground(option.dataset.type)
      );
    });

    // Custom image input
    document
      .getElementById("bg-image-input")
      .addEventListener("change", (e) => {
        this.handleCustomImageUpload(e.target.files[0]);
      });

    // Window control events
    document
      .getElementById("minimize-btn")
      .addEventListener("click", () => this.minimizeWindow());
    document
      .getElementById("maximize-btn")
      .addEventListener("click", () => this.maximizeWindow());
    document
      .getElementById("close-btn")
      .addEventListener("click", () => this.closeWindow());

    // Listen for app quitting
    ipcRenderer.on("app-quitting", () => {
      this.leaveMeeting();
    });
  }

  async joinMeeting() {
    const meetingId = document.getElementById("meeting-id").value.trim();
    const userName = document.getElementById("user-name").value.trim();
    const userRole = parseInt(document.getElementById("user-role").value);

    if (!meetingId || !userName) {
      alert("Please enter both meeting ID and your name");
      return;
    }

    this.currentSession = meetingId;
    this.currentUserName = userName;
    this.currentUserRole = userRole; // 1 = Presenter, 0 = Audience

    console.log("👤 User joining with role:", {
      userName,
      role: userRole === 1 ? "Presenter" : "Audience",
    });

    this.showScreen("loading-screen");

    try {
      await this.initializeZoomClient();
      await this.joinSession();
    } catch (error) {
      console.error("Failed to join meeting:", error);
      alert(
        "Failed to join meeting. Please check your connection and try again."
      );
      this.showScreen("home-screen");
    }
  }

  async createMeeting() {
    const userName = document.getElementById("user-name").value.trim();
    const userRole = parseInt(document.getElementById("user-role").value);

    if (!userName) {
      alert("Please enter your name");
      return;
    }

    // Generate a random meeting ID
    const meetingId = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.currentSession = meetingId;
    this.currentUserName = userName;
    this.currentUserRole = userRole; // 1 = Presenter, 0 = Audience

    console.log("👤 User creating meeting with role:", {
      userName,
      role: userRole === 1 ? "Presenter" : "Audience",
    });

    // Update the meeting ID input
    document.getElementById("meeting-id").value = meetingId;

    this.showScreen("loading-screen");

    try {
      await this.initializeZoomClient();
      await this.joinSession();
    } catch (error) {
      console.error("Failed to create meeting:", error);
      alert("Failed to create meeting. Please try again.");
      this.showScreen("home-screen");
    }
  }

  async initializeZoomClient() {
    try {
      // Wait for Zoom Video SDK to be loaded
      let attempts = 0;
      const maxAttempts = 10;

      while (!ZoomVideo && attempts < maxAttempts) {
        console.log(
          `Waiting for Zoom Video SDK to load... attempt ${attempts + 1}`
        );
        await new Promise((resolve) => setTimeout(resolve, 500));
        attempts++;
      }

      // Check if Zoom Video SDK is available
      if (!ZoomVideo) {
        throw new Error(
          "Zoom Video SDK not loaded after multiple attempts. Please check your installation."
        );
      }

      // Check if createClient method exists
      if (typeof ZoomVideo.createClient !== "function") {
        // Try to initialize the SDK first if there's an init method
        if (ZoomVideo.default && typeof ZoomVideo.default.init === "function") {
          console.log("🔧 Initializing Zoom Video SDK first...");
          try {
            ZoomVideo.default.init();
            console.log("✅ SDK initialized");
          } catch (initError) {
            console.log("⚠️  SDK init failed:", initError.message);
          }
        }
        console.error("ZoomVideo object:", ZoomVideo);
        console.error("Available methods:", Object.keys(ZoomVideo));

        // Debug: Check what's in the default property
        if (ZoomVideo.default) {
          console.log("ZoomVideo.default:", ZoomVideo.default);
          console.log(
            "ZoomVideo.default methods:",
            Object.keys(ZoomVideo.default)
          );

          // Check for initialization methods
          const initMethods = Object.keys(ZoomVideo.default).filter(
            (key) =>
              key.toLowerCase().includes("init") ||
              key.toLowerCase().includes("setup") ||
              key.toLowerCase().includes("configure")
          );
          if (initMethods.length > 0) {
            console.log("🔧 Found initialization methods:", initMethods);
          }
        }

        // Debug: Check if any property has createClient
        console.log("Searching for createClient method...");
        for (const key of Object.keys(ZoomVideo)) {
          const value = ZoomVideo[key];
          if (value && typeof value === "object") {
            if (typeof value.createClient === "function") {
              console.log(`✅ Found createClient in ZoomVideo.${key}`);
            } else if (value.createClient !== undefined) {
              console.log(
                `⚠️  ZoomVideo.${key}.createClient exists but is not a function:`,
                typeof value.createClient
              );
            }
          }
        }

        // Try to find the createClient method in different locations
        let createClientMethod = null;

        // Check if it's in the default export
        if (
          ZoomVideo.default &&
          typeof ZoomVideo.default.createClient === "function"
        ) {
          // Bind the method to the correct context
          createClientMethod = ZoomVideo.default.createClient.bind(
            ZoomVideo.default
          );
          console.log("Found createClient in ZoomVideo.default");
        }
        // Check if it's directly available
        else if (typeof ZoomVideo.createClient === "function") {
          createClientMethod = ZoomVideo.createClient;
          console.log("Found createClient directly in ZoomVideo");
        }
        // Check if it's in a different property
        else {
          // Look for any property that might contain createClient
          for (const key of Object.keys(ZoomVideo)) {
            if (
              ZoomVideo[key] &&
              typeof ZoomVideo[key].createClient === "function"
            ) {
              createClientMethod = ZoomVideo[key].createClient;
              console.log(`Found createClient in ZoomVideo.${key}`);
              break;
            }
          }
        }

        // If still not found, try to use ZoomVideo directly if it has createClient
        if (
          !createClientMethod &&
          typeof ZoomVideo.createClient === "function"
        ) {
          createClientMethod = ZoomVideo.createClient;
          console.log("Using ZoomVideo.createClient directly");
        }

        if (!createClientMethod) {
          // Last resort: try to find any method that might be createClient
          console.log(
            "Last resort: searching for any method that might be createClient..."
          );
          for (const key of Object.keys(ZoomVideo)) {
            const value = ZoomVideo[key];
            if (
              value &&
              typeof value === "function" &&
              key.toLowerCase().includes("client")
            ) {
              console.log(
                `Trying ZoomVideo.${key} as potential createClient method`
              );
              try {
                this.client = value();
                console.log(
                  `✅ Successfully created client using ZoomVideo.${key}`
                );
                return; // Exit early if successful
              } catch (error) {
                console.log(`❌ ZoomVideo.${key} failed:`, error.message);
              }
            }
          }

          throw new Error(
            "Zoom Video SDK createClient method not found. SDK may not be properly loaded."
          );
        }

        // Use the found method
        try {
          this.client = createClientMethod();
          console.log("✅ Client created successfully using bound method");
        } catch (error) {
          console.log("⚠️  Bound method failed, trying direct call...");

          // Try calling directly on the class
          if (
            ZoomVideo.default &&
            typeof ZoomVideo.default.createClient === "function"
          ) {
            try {
              this.client = ZoomVideo.default.createClient();
              console.log(
                "✅ Client created successfully using direct class call"
              );
            } catch (directError) {
              console.error("❌ Direct class call also failed:", directError);
              throw directError;
            }
          } else {
            throw error;
          }
        }
      } else {
        // Initialize Zoom Video SDK client
        this.client = ZoomVideo.createClient();
      }

      // Set up event listeners
      this.setupZoomEventListeners();

      // Initialize the client
      await this.client.init("en-US", "Global", { patchJsMedia: true });
    } catch (error) {
      console.error("Failed to initialize Zoom client:", error);
      throw error;
    }
  }

  setupZoomEventListeners() {
    if (!this.client) return;

    // Peer video state change
    this.client.on("peer-video-state-change", (event) => {
      this.handleVideoStateChange(event);
    });

    // Peer audio state change
    this.client.on("peer-audio-state-change", (event) => {
      this.handleAudioStateChange(event);
    });

    // User joined
    this.client.on("user-joined", (event) => {
      this.handleUserJoined(event);
    });

    // User left
    this.client.on("user-left", (event) => {
      this.handleUserLeft(event);
    });

    // Session join
    this.client.on("session-join", (event) => {
      this.handleSessionJoin(event);
    });

    // Session leave
    this.client.on("session-leave", (event) => {
      this.handleSessionLeave(event);
    });

    // Chat message received
    this.client.on("chat-message", (event) => {
      this.handleChatMessage(event);
    });

    // Set up periodic participant refresh to catch any missed participants
    setInterval(() => {
      if (this.client) {
        this.refreshParticipants();

        // If audience role and no presenter found, try to identify again
        if (this.currentUserRole === 0 && !this.presenterUserId) {
          console.log("🔄 Audience: Periodic presenter check");
          this.identifyPresenter();
        }
      }
    }, 5000); // Check every 5 seconds
  }

  async joinSession() {
    try {
      // Get JWT signature from backend server
      const jwt = await this.getSignatureFromServer(
        this.currentSession,
        this.currentUserName,
        this.currentUserRole
      );

      // Join the session
      await this.client.join(this.currentSession, jwt, this.currentUserName);

      // Start media streams
      const mediaStream = this.client.getMediaStream();
      await mediaStream.startAudio();
      await mediaStream.startVideo();

      // Update UI
      this.updateMeetingInfo();
      this.showScreen("video-screen");

      // Render local video
      await this.renderLocalVideo();
    } catch (error) {
      console.error("Failed to join session:", error);
      throw error;
    }
  }

  async getSignatureFromServer(sessionName, userName, role) {
    try {
      const response = await fetch(
        `http://localhost:4000/getSignature?sessionName=${encodeURIComponent(
          sessionName
        )}&role=${role}&userName=${encodeURIComponent(userName)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Signature server error: ${errorData.error || response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error("Failed to get signature from server");
      }

      console.log("Signature received from server:", {
        sessionName: data.sessionName,
        role: data.role,
        expiresAt: data.expiresAt,
      });

      return data.signature;
    } catch (error) {
      console.error("Error getting signature from server:", error);

      // Fallback to local JWT generation if server is unavailable
      console.log("Falling back to local JWT generation...");
      try {
        const jwt = await ipcRenderer.invoke("generate-jwt", sessionName);
        return jwt;
      } catch (fallbackError) {
        throw new Error(
          `Both server and local JWT generation failed. Server error: ${error.message}, Local error: ${fallbackError.message}`
        );
      }
    }
  }

  async renderLocalVideo() {
    try {
      // Skip video rendering during background changes to prevent duplicates
      if (this.isChangingBackground || window.__VIDEO_EVENTS_DISABLED__) {
        console.log(
          "⏸️ Skipping local video rendering during background change"
        );
        return;
      }

      // Additional check: if we're in the middle of a background change, block all video operations
      if (this.isChangingBackground) {
        console.log(
          "🚫 Blocking local video rendering during background change"
        );
        return;
      }

      const mediaStream = this.client.getMediaStream();
      console.log("🔍 MediaStream object:", mediaStream);
      console.log(
        "🔍 MediaStream methods:",
        Object.getOwnPropertyNames(Object.getPrototypeOf(mediaStream))
      );

      // Get current user info
      const currentUser = this.client.getCurrentUserInfo();
      console.log("👤 Current user:", currentUser);

      // Role-based video rendering logic
      if (this.currentUserRole === 0) {
        // Audience role: Don't show local video
        console.log("👥 Audience role: Skipping local video display");
        return;
      }

      // Presenter role: Show local video
      console.log(
        "🎥 Using Zoom Video SDK attachVideo method for local video (Presenter)"
      );

      try {
        // Use Zoom Video SDK's attachVideo method with proper parameters
        // attachVideo(userId, videoQuality) returns the HTML video element
        const videoElement = await mediaStream.attachVideo(
          currentUser.userId,
          1
        ); // 1 = Video_720P quality
        console.log(
          "✅ Local video attached successfully, video element:",
          videoElement
        );

        // The SDK returns the video element, so we need to add it to our container
        if (videoElement && this.videoContainer) {
          // Create a container for the local video
          const localVideoContainer = document.createElement("div");
          localVideoContainer.className = "video-item local-video fade-in";
          localVideoContainer.setAttribute("data-user-id", currentUser.userId);

          // Add participant info
          const participantInfo = document.createElement("div");
          participantInfo.className = "participant-info";
          participantInfo.textContent = "You (Local)";

          // Add mute indicator
          const muteIndicator = document.createElement("div");
          muteIndicator.className = "mute-indicator";
          muteIndicator.innerHTML = '<i class="fas fa-microphone"></i>';

          // Append everything
          localVideoContainer.appendChild(videoElement);
          localVideoContainer.appendChild(participantInfo);
          localVideoContainer.appendChild(muteIndicator);

          // Add to video container
          this.videoContainer.appendChild(localVideoContainer);

          // Store reference for local user
          const localUserName =
            this.currentUserName || currentUser.displayName || "You";
          this.participants.set(currentUser.userId, {
            userId: currentUser.userId,
            userName: localUserName,
            element: localVideoContainer,
          });
          console.log("👤 Local user stored:", {
            userId: currentUser.userId,
            userName: localUserName,
          });
        } else {
          console.error("❌ Video element or container not found");
        }
      } catch (error) {
        console.error("❌ Error attaching local video:", error);
      }
    } catch (error) {
      console.error("Error rendering local video:", error);

      // Fallback: try to render directly
      try {
        const mediaStream = this.client.getMediaStream();
        const videoElement = document.getElementById("localVideo");
        if (videoElement && mediaStream) {
          console.log("🔄 Fallback: trying direct video rendering");
          videoElement.srcObject = mediaStream;
          videoElement.play().catch(console.error);
        }
      } catch (fallbackError) {
        console.error("Fallback video rendering also failed:", fallbackError);
      }
    }
  }

  handleVideoStateChange(event) {
    const { action, userId } = event;
    console.log("🎥 Video state change:", { action, userId });

    // Skip video rendering during background changes to prevent duplicates
    if (this.isChangingBackground || window.__VIDEO_EVENTS_DISABLED__) {
      console.log("⏸️ Skipping video rendering during background change");
      return;
    }

    // Additional check: if we're in the middle of a background change, block all video operations
    if (this.isChangingBackground) {
      console.log("🚫 Blocking video state change during background change");
      return;
    }

    let participant = this.participants.get(userId);
    console.log("👤 Participant found:", participant);

    // If participant not found but video is starting, create them
    if (!participant && action === "Start") {
      console.log("🆕 Creating participant for video start:", userId);

      // Create a temporary participant entry
      const tempUserName = `User ${userId}`;
      participant = { userId, userName: tempUserName, element: null };
      this.participants.set(userId, participant);

      // Update participant count
      this.updateParticipantCount();

      console.log("👤 Temporary participant created:", participant);
    }

    if (action === "Start") {
      console.log("🎬 Starting video for participant:", userId);

      // For audience role, check if this is the presenter
      if (this.currentUserRole === 0) {
        if (!this.presenterUserId) {
          // No presenter identified yet, assume this user is presenter
          this.presenterUserId = userId;
          console.log(
            "🎭 Audience: Identified presenter from video start:",
            userId
          );
        }

        if (userId === this.presenterUserId) {
          console.log("🎬 Audience: Presenter started video, rendering now");
          this.renderParticipantVideo(userId);
        } else {
          console.log("👥 Audience: Non-presenter video started, ignoring");
        }
      } else {
        // Presenter role: render all videos
        this.renderParticipantVideo(userId);
      }
    } else if (action === "Stop") {
      console.log("⏹️  Stopping video for participant:", userId);
      // Don't remove the video element, just update the UI to show "No Video"
      this.updateParticipantVideoStatus(userId, false);
    }
  }

  // Update participant video status (video on/off)
  updateParticipantVideoStatus(userId, hasVideo) {
    const participant = this.participants.get(userId);
    if (participant && participant.element) {
      const videoItem = participant.element;

      if (hasVideo) {
        videoItem.classList.remove("fallback-video");
        videoItem.classList.add("has-video");
      } else {
        videoItem.classList.remove("has-video");
        videoItem.classList.add("fallback-video");

        // Update the "No Video" label
        const noVideoLabel = videoItem.querySelector("::before");
        if (noVideoLabel) {
          noVideoLabel.content = "Video Off";
        }
      }
    }
  }

  handleAudioStateChange(event) {
    const { action, userId } = event;
    const participant = this.participants.get(userId);

    if (participant) {
      const muteIndicator =
        participant.element.querySelector(".mute-indicator");
      if (muteIndicator) {
        muteIndicator.classList.toggle("muted", action === "Stop");
      }
    }
  }

  handleUserJoined(event) {
    const { userId, userName } = event;
    console.log("👥 User joined:", { userId, userName });

    // Add participant to map
    this.participants.set(userId, { userId, userName, element: null });

    // Identify presenter (first user with role 1, or current user if they're presenter)
    if (this.currentUserRole === 1 && !this.presenterUserId) {
      this.presenterUserId = userId;
      console.log("🎭 Presenter identified:", { userId, userName });
    } else if (this.currentUserRole === 0 && !this.presenterUserId) {
      // Audience role: Look for any presenter in the session
      this.identifyPresenter();
    }

    this.updateParticipantCount();

    // Don't render video here - wait for video state change event
    console.log("👤 Participant added to map, waiting for video state change");
  }

  // Identify presenter in the session
  identifyPresenter() {
    try {
      if (this.client) {
        const allUsers = this.client.getAllUser();
        console.log("🔍 Looking for presenter in session:", allUsers);

        // Find first user with role 1 (presenter)
        for (const user of allUsers) {
          if (user.role === 1) {
            this.presenterUserId = user.userId;
            console.log("🎭 Presenter found:", {
              userId: user.userId,
              userName: user.displayName,
            });
            break;
          }
        }

        // If no presenter found, assume first user is presenter
        if (!this.presenterUserId && allUsers.length > 0) {
          this.presenterUserId = allUsers[0].userId;
          console.log("🎭 Assuming first user as presenter:", {
            userId: this.presenterUserId,
          });
        }

        // If still no presenter, use the first user who joined
        if (!this.presenterUserId && this.participants.size > 0) {
          const firstParticipant = Array.from(this.participants.keys())[0];
          this.presenterUserId = firstParticipant;
          console.log("🎭 Using first participant as presenter:", {
            userId: this.presenterUserId,
          });
        }

        console.log("🎭 Final presenter ID:", this.presenterUserId);

        // If we're audience and found a presenter, try to render their video
        if (this.currentUserRole === 0 && this.presenterUserId) {
          console.log("🎬 Audience: Attempting to render presenter video");
          this.renderParticipantVideo(this.presenterUserId);
        }
      }
    } catch (error) {
      console.error("❌ Error identifying presenter:", error);
    }
  }

  handleUserLeft(event) {
    const { userId } = event;
    this.removeParticipantVideo(userId);
    this.participants.delete(userId);
    this.updateParticipantCount();
  }

  handleSessionJoin(event) {
    console.log("🎉 Session joined successfully");
    console.log("📊 Session info:", event);

    // Get all users from the session
    try {
      const allUsers = this.client.getAllUser();
      console.log("👥 All users in session:", allUsers);

      // Add any existing users to our participants map
      allUsers.forEach((user) => {
        if (user.userId !== this.client.getCurrentUserInfo().userId) {
          const userName = user.displayName || `User ${user.userId}`;
          this.participants.set(user.userId, {
            userId: user.userId,
            userName: userName,
            element: null,
          });
          console.log("👤 Added existing user to participants:", {
            userId: user.userId,
            userName,
          });
        }
      });

      // Update participant count
      this.updateParticipantCount();

      // Identify presenter after getting all users
      if (this.currentUserRole === 0) {
        this.identifyPresenter();

        // If presenter found, try to render their video immediately
        if (this.presenterUserId) {
          console.log(
            "🎬 Audience: Rendering presenter video after session join"
          );
          setTimeout(() => {
            this.renderParticipantVideo(this.presenterUserId);
          }, 1000); // Small delay to ensure everything is ready
        }
      }
    } catch (error) {
      console.error("❌ Error getting all users:", error);
    }
  }

  handleSessionLeave(event) {
    console.log("Session left");
    this.leaveMeeting();
  }

  handleChatMessage(event) {
    const { message, senderName, senderId } = event;
    this.addChatMessage(
      senderName,
      message,
      senderId !== this.client.getCurrentUserInfo().userId
    );
  }

  async renderParticipantVideo(userId) {
    try {
      console.log("🎥 Rendering participant video for:", userId);

      // Skip video rendering during background changes to prevent duplicates
      if (this.isChangingBackground || window.__VIDEO_EVENTS_DISABLED__) {
        console.log("⏸️ Skipping video rendering during background change");
        return;
      }

      // Additional check: if we're in the middle of a background change, block all video operations
      if (this.isChangingBackground) {
        console.log(
          "🚫 Blocking participant video rendering during background change"
        );
        return;
      }

      // Role-based video rendering logic
      if (this.currentUserRole === 0) {
        // Audience role: Only show presenter video
        if (!this.presenterUserId) {
          console.log(
            "👥 Audience role: No presenter identified yet, skipping video"
          );
          return;
        }

        if (userId !== this.presenterUserId) {
          console.log(
            "👥 Audience role: Skipping non-presenter video for userId:",
            userId
          );
          return;
        }

        console.log(
          "👥 Audience role: Rendering presenter video for userId:",
          userId
        );
      } else {
        // Presenter role: Show all participant videos
        console.log(
          "🎬 Presenter role: Rendering participant video for userId:",
          userId
        );
      }

      const mediaStream = this.client.getMediaStream();
      console.log("🔍 Participant mediaStream:", mediaStream);

      // Get participant info
      const participant = this.participants.get(userId);
      if (!participant) {
        console.warn("⚠️  Participant not found for userId:", userId);
        return;
      }

      // Create video element for participant
      const videoItem = document.createElement("div");
      videoItem.className = "video-item fade-in";
      videoItem.setAttribute("data-user-id", userId);

      const video = document.createElement("video");
      video.autoplay = true;
      video.muted = false; // Don't mute other participants
      video.playsInline = true;

      try {
        // Use Zoom Video SDK's attachVideo method for remote participants
        // attachVideo(userId, videoQuality) returns the HTML video element
        const videoElement = await mediaStream.attachVideo(userId, 1); // 1 = Video_720P
        console.log(
          "✅ Participant video attached successfully, video element:",
          videoElement
        );

        if (videoElement) {
          // Use the video element returned by the SDK
          videoItem.appendChild(videoElement);
        } else {
          // Fallback: use our created video element
          console.log("🔄 Using fallback video element");
          videoItem.appendChild(video);
        }
      } catch (attachError) {
        console.error("❌ Error attaching participant video:", attachError);
        // Fallback: use our created video element
        console.log("🔄 Using fallback video element");
        videoItem.appendChild(video);
      }

      const participantInfo = document.createElement("div");
      participantInfo.className = "participant-info";
      participantInfo.textContent = participant.userName;

      const muteIndicator = document.createElement("div");
      muteIndicator.className = "mute-indicator";
      muteIndicator.innerHTML = '<i class="fas fa-microphone"></i>';

      videoItem.appendChild(participantInfo);
      videoItem.appendChild(muteIndicator);

      if (this.videoContainer) {
        this.videoContainer.appendChild(videoItem);
        console.log("✅ Participant video element added to container");

        // Store reference
        participant.element = videoItem;
      } else {
        console.error("❌ Video container not found!");
      }
    } catch (error) {
      console.error("❌ Failed to render participant video:", error);
    }
  }

  removeParticipantVideo(userId) {
    const participant = this.participants.get(userId);
    if (participant && participant.element) {
      participant.element.remove();
      participant.element = null;
    }
  }

  // addVideoElement method removed - now using Zoom Video SDK's renderVideo directly

  async toggleAudio() {
    try {
      const mediaStream = this.client.getMediaStream();

      if (this.isAudioMuted) {
        await mediaStream.startAudio();
        this.isAudioMuted = false;
        document.getElementById("mute-audio").classList.remove("muted");
        document.getElementById("mute-audio").innerHTML =
          '<i class="fas fa-microphone"></i>';
      } else {
        await mediaStream.stopAudio();
        this.isAudioMuted = true;
        document.getElementById("mute-audio").classList.add("muted");
        document.getElementById("mute-audio").innerHTML =
          '<i class="fas fa-microphone-slash"></i>';
      }
    } catch (error) {
      console.error("Failed to toggle audio:", error);
    }
  }

  async toggleVideo() {
    try {
      const mediaStream = this.client.getMediaStream();

      if (this.isVideoMuted) {
        await mediaStream.startVideo();
        this.isVideoMuted = false;
        document.getElementById("mute-video").classList.remove("muted");
        document.getElementById("mute-video").innerHTML =
          '<i class="fas fa-video"></i>';
      } else {
        await mediaStream.stopVideo();
        this.isVideoMuted = true;
        document.getElementById("mute-video").classList.add("muted");
        document.getElementById("mute-video").innerHTML =
          '<i class="fas fa-video-slash"></i>';
      }
    } catch (error) {
      console.error("Failed to toggle video:", error);
    }
  }

  async toggleScreenShare() {
    try {
      if (this.isScreenSharing) {
        await this.client.getMediaStream().stopScreenShare();
        this.isScreenSharing = false;
        document.getElementById("screen-share").classList.remove("active");
      } else {
        await this.client.getMediaStream().startScreenShare();
        this.isScreenSharing = true;
        document.getElementById("screen-share").classList.add("active");
      }
    } catch (error) {
      console.error("Failed to toggle screen share:", error);
    }
  }

  toggleChat() {
    const chatPanel = document.getElementById("chat-panel");
    chatPanel.classList.toggle("hidden");
  }

  sendChatMessage() {
    const input = document.getElementById("chat-input");
    const message = input.value.trim();

    if (message && this.client) {
      try {
        this.client.getChatHelper().sendChatMessage(message);
        this.addChatMessage(this.currentUserName, message, true);
        input.value = "";
      } catch (error) {
        console.error("Failed to send chat message:", error);
      }
    }
  }

  addChatMessage(senderName, message, isOwn = false) {
    const chatMessages = document.getElementById("chat-messages");
    const messageDiv = document.createElement("div");
    messageDiv.className = `chat-message ${isOwn ? "own" : ""}`;

    const senderDiv = document.createElement("div");
    senderDiv.className = "sender";
    senderDiv.textContent = senderName;

    const textDiv = document.createElement("div");
    textDiv.className = "text";
    textDiv.textContent = message;

    messageDiv.appendChild(senderDiv);
    messageDiv.appendChild(textDiv);
    chatMessages.appendChild(messageDiv);

    // Auto-scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async leaveMeeting() {
    try {
      if (this.client) {
        await this.client.leave();
        this.client = null;
      }

      // Clear participants
      this.participants.clear();
      this.videoContainer.innerHTML = "";

      // Reset state
      this.currentSession = null;
      this.currentUserName = "";
      this.isAudioMuted = false;
      this.isVideoMuted = false;
      this.isScreenSharing = false;

      // Show home screen
      this.showScreen("home-screen");
    } catch (error) {
      console.error("Error leaving meeting:", error);
    }
  }

  updateMeetingInfo() {
    document.getElementById("meeting-id-display").textContent =
      this.currentSession;
    this.updateParticipantCount();

    // Update role display
    const roleDisplay = document.getElementById("user-role-display");
    if (roleDisplay) {
      if (this.currentUserRole === 1) {
        roleDisplay.textContent = "🎭 Presenter";
        roleDisplay.className = "user-role presenter";
      } else {
        roleDisplay.textContent = `👥 Audience (Presenter: ${
          this.presenterUserId || "None"
        })`;
        roleDisplay.className = "user-role audience";
      }
    }

    // Update background controls based on role
    this.updateBackgroundControls();
  }

  updateParticipantCount() {
    const count = this.participants.size;
    document.getElementById(
      "participant-count"
    ).textContent = `${count} participant${count !== 1 ? "s" : ""}`;
    console.log("📊 Participant count updated:", count);
  }

  // Method to refresh participant list from Zoom SDK
  refreshParticipants() {
    try {
      if (this.client) {
        const allUsers = this.client.getAllUser();
        console.log("🔄 Refreshing participants from SDK:", allUsers);

        // Update our participants map
        allUsers.forEach((user) => {
          if (user.userId !== this.client.getCurrentUserInfo().userId) {
            const userName = user.displayName || `User ${user.userId}`;
            this.participants.set(user.userId, {
              userId: user.userId,
              userName: userName,
              element: null,
            });
          }
        });

        this.updateParticipantCount();
      }
    } catch (error) {
      console.error("❌ Error refreshing participants:", error);
    }
  }

  showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll(".screen").forEach((screen) => {
      screen.classList.remove("active");
    });

    // Show target screen
    document.getElementById(screenId).classList.add("active");
  }

  minimizeWindow() {
    ipcRenderer.send("minimize-window");
  }

  maximizeWindow() {
    ipcRenderer.send("maximize-window");
  }

  closeWindow() {
    ipcRenderer.send("close-window");
  }

  // Background Change Methods (Presenter Only)

  // Show background selection modal
  showBackgroundModal() {
    if (this.currentUserRole !== 1) {
      console.log("❌ Only presenters can change backgrounds");
      return;
    }

    // Check if video is on
    if (!this.client || !this.client.getCurrentUserInfo()?.bVideoOn) {
      console.log(
        "⚠️ Please start your video first before changing backgrounds"
      );
      alert("Please start your video first before changing backgrounds");
      return;
    }

    console.log("🎨 Opening background selection modal");
    const modal = document.getElementById("background-modal");
    if (!modal) {
      console.error("❌ Background modal not found in DOM");
      return;
    }

    modal.classList.remove("hidden");
    console.log("✅ Background modal opened");

    // Update selected background
    document.querySelectorAll(".background-option").forEach((option) => {
      option.classList.remove("selected");
      if (option.dataset.type === this.currentBackground) {
        option.classList.add("selected");
      }
    });
  }

  // Hide background selection modal
  hideBackgroundModal() {
    const modal = document.getElementById("background-modal");
    modal.classList.add("hidden");
  }

  // Select background type
  selectBackground(type) {
    if (this.currentUserRole !== 1) {
      console.log("❌ Only presenters can change backgrounds");
      return;
    }

    console.log("🎨 Selecting background type:", type);

    switch (type) {
      case "none":
        console.log("🎨 Applying no background");
        this.removeBackground();
        break;
      case "blur":
        console.log("🎨 Applying blur background");
        this.applyBlurBackground();
        break;
      case "black":
        console.log("🎨 Applying black background");
        this.applySolidColorBackground("#000000");
        break;
      case "green":
        console.log("🎨 Applying green screen background");
        this.applySolidColorBackground("#00FF00");
        break;
      case "blue":
        console.log("🎨 Applying blue screen background");
        this.applySolidColorBackground("#0066FF");
        break;
      case "image":
        console.log("🎨 Opening image file picker");
        document.getElementById("bg-image-input").click();
        break;
      default:
        console.log("⚠️ Unknown background type:", type);
        return;
    }

    // Update selected state
    document.querySelectorAll(".background-option").forEach((option) => {
      option.classList.remove("selected");
      if (option.dataset.type === type) {
        option.classList.add("selected");
      }
    });

    this.currentBackground = type;
    this.hideBackgroundModal();
  }

  // Apply blur background
  async applyBlurBackground() {
    try {
      if (this.currentUserRole !== 1) {
        console.log("❌ Only presenters can change backgrounds");
        return;
      }

      console.log("🎨 Applying blur background using Zoom SDK");

      if (!this.client || !this.client.getMediaStream) {
        throw new Error("Media stream not available");
      }

      const mediaStream = this.client.getMediaStream();
      if (!mediaStream) {
        throw new Error("Media stream not initialized");
      }

      // Check if video is on
      const currentUser = this.client.getCurrentUserInfo();
      if (!currentUser || !currentUser.bVideoOn) {
        console.log("⚠️ Please start your video first");
        return;
      }

      // Set flag to prevent duplicate video rendering during background change
      this.isChangingBackground = true;

      // Disable video event listeners to prevent new video streams
      this.disableVideoEventListeners();

      // Apply blur background using Zoom's built-in feature
      await mediaStream.stopVideo();
      await new Promise((resolve) => setTimeout(resolve, 100)); // Buffer time

      await mediaStream.startVideo({
        virtualBackground: {
          imageUrl: "blur", // Zoom's built-in blur effect
        },
      });

      this.currentBackground = "blur";
      console.log("✅ Blur background applied via Zoom SDK");

      // Reset flag after background change and cleanup duplicates
      setTimeout(() => {
        this.isChangingBackground = false;
        console.log(
          "🔄 Background change completed, video rendering re-enabled"
        );
        this.reEnableVideoEventListeners(); // Re-enable video event listeners
        this.cleanupDuplicateVideos(); // Clean up any duplicate videos
      }, 1000);
    } catch (error) {
      console.error("❌ Error applying blur background:", error);
      console.log("💡 Falling back to CSS-based blur effect");

      // Fallback to CSS-based approach
      this.applyCSSBackgroundEffect("blur");
      this.currentBackground = "blur";

      // Reset flag on error
      this.isChangingBackground = false;
      this.reEnableVideoEventListeners(); // Re-enable video event listeners on error
    }
  }

  // Apply custom image background
  async applyCustomImageBackground(imageFile) {
    try {
      if (this.currentUserRole !== 1) {
        console.log("❌ Only presenters can change backgrounds");
        return;
      }

      console.log("🎨 Applying custom image background using Zoom SDK");

      if (!this.client || !this.client.getMediaStream) {
        throw new Error("Media stream not available");
      }

      const mediaStream = this.client.getMediaStream();
      if (!mediaStream) {
        throw new Error("Media stream not initialized");
      }

      // Check if video is on
      const currentUser = this.client.getCurrentUserInfo();
      if (!currentUser || !currentUser.bVideoOn) {
        console.log("⚠️ Please start your video first");
        return;
      }

      // Set flag to prevent duplicate video rendering during background change
      this.isChangingBackground = true;

      // Convert file to data URL
      const imageUrl = await this.fileToDataURL(imageFile);

      // Apply image background using Zoom's built-in feature
      await mediaStream.stopVideo();
      await new Promise((resolve) => setTimeout(resolve, 100)); // Buffer time

      await mediaStream.startVideo({
        virtualBackground: {
          imageUrl: imageUrl,
        },
      });

      this.currentBackground = "image";
      this.customBackgroundImage = imageUrl;
      console.log("✅ Custom image background applied via Zoom SDK");

      // Reset flag after background change and cleanup duplicates
      setTimeout(() => {
        this.isChangingBackground = false;
        console.log(
          "🔄 Background change completed, video rendering re-enabled"
        );
        this.cleanupDuplicateVideos(); // Clean up any duplicate videos
      }, 1000);
    } catch (error) {
      console.error("❌ Error applying custom image background:", error);
      console.log("💡 Falling back to CSS-based image background");

      // Fallback to CSS-based approach
      this.applyCSSBackgroundEffect("image", this.customBackgroundImage);
      this.currentBackground = "image";
    }
  }

  // Remove background
  async removeBackground() {
    try {
      if (this.currentUserRole !== 1) {
        console.log("❌ Only presenters can change backgrounds");
        return;
      }

      console.log("🎨 Removing background using Zoom SDK");

      if (!this.client || !this.client.getMediaStream) {
        throw new Error("Media stream not available");
      }

      const mediaStream = this.client.getMediaStream();
      if (!mediaStream) {
        throw new Error("Media stream not initialized");
      }

      // Check if video is on
      const currentUser = this.client.getCurrentUserInfo();
      if (!currentUser || !currentUser.bVideoOn) {
        console.log("⚠️ Please start your video first");
        return;
      }

      // Set flag to prevent duplicate video rendering during background change
      this.isChangingBackground = true;

      // Remove virtual background by restarting video without background
      await mediaStream.stopVideo();
      await new Promise((resolve) => setTimeout(resolve, 100)); // Buffer time

      await mediaStream.startVideo(); // No virtualBackground parameter

      this.currentBackground = "none";
      this.customBackgroundImage = null;
      console.log("✅ Background removed via Zoom SDK");

      // Reset flag after background change and cleanup duplicates
      setTimeout(() => {
        this.isChangingBackground = false;
        console.log(
          "🔄 Background change completed, video rendering re-enabled"
        );
        this.cleanupDuplicateVideos(); // Clean up any duplicate videos
      }, 1000);
    } catch (error) {
      console.error("❌ Error removing background:", error);
      console.log("💡 Falling back to CSS-based background removal");

      // Fallback to CSS-based approach
      this.applyCSSBackgroundEffect("none");
      this.currentBackground = "none";
      this.customBackgroundImage = null;
    }
  }

  // Initialize background processor
  async initializeBackgroundProcessor() {
    try {
      console.log("🔧 Initializing background processor using Zoom Video SDK");

      // Check if we have access to the media stream
      if (!this.client || !this.client.getMediaStream) {
        throw new Error("Media stream not available");
      }

      const mediaStream = this.client.getMediaStream();
      if (!mediaStream) {
        throw new Error("Media stream not initialized");
      }

      // For now, we'll use a simple approach with CSS filters
      // In a full implementation, you would use Zoom's background processing
      this.backgroundProcessor = {
        type: "css-filter",
        mediaStream: mediaStream,
      };

      console.log("✅ Background processor initialized (CSS-based)");
    } catch (error) {
      console.error("❌ Error initializing background processor:", error);
      console.log("💡 Using fallback CSS-based background effects");

      // Fallback to CSS-based approach
      this.backgroundProcessor = {
        type: "css-filter",
        mediaStream: null,
      };
    }
  }

  // Handle custom image upload
  handleCustomImageUpload(file) {
    if (file) {
      this.applyCustomImageBackground(file);
    }
  }

  // Convert file to data URL
  fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Show/hide background controls based on role
  updateBackgroundControls() {
    const backgroundControls = document.getElementById("background-controls");
    if (backgroundControls) {
      if (this.currentUserRole === 1) {
        backgroundControls.style.display = "flex";
        console.log("🎨 Background controls enabled for presenter");
      } else {
        backgroundControls.style.display = "none";
        console.log("👥 Background controls hidden for audience");
      }
    } else {
      console.error("❌ Background controls element not found");
    }
  }

  // Apply CSS-based background effects (fallback method)
  applyCSSBackgroundEffect(type, imageUrl = null) {
    try {
      console.log("🎨 Applying CSS background effect (fallback):", type);

      // Find the local video container and video element
      const localVideoContainer = document.querySelector(".local-video");
      const localVideo = localVideoContainer?.querySelector("video");

      if (!localVideo || !localVideoContainer) {
        console.log("⚠️ Local video element not found");
        return;
      }

      // Remove existing background effects and classes
      localVideo.style.filter = "";
      localVideo.style.backgroundImage = "";
      localVideo.style.backgroundSize = "";
      localVideo.style.backgroundPosition = "";
      localVideoContainer.classList.remove(
        "blur-effect",
        "image-effect",
        "solid-effect"
      );

      switch (type) {
        case "blur":
          // Apply blur filter to the video
          localVideo.style.filter = "blur(8px)";
          localVideoContainer.classList.add("blur-effect");
          console.log("✅ Blur effect applied via CSS fallback");
          break;

        case "image":
          if (imageUrl) {
            // Apply background image behind the video
            localVideo.style.backgroundImage = `url(${imageUrl})`;
            localVideo.style.backgroundSize = "cover";
            localVideo.style.backgroundPosition = "center";
            localVideoContainer.classList.add("image-effect");
            console.log("✅ Custom image background applied via CSS fallback");
          }
          break;

        case "none":
        default:
          // No effects - clean video
          console.log("✅ Background effects removed via CSS fallback");
          break;
      }
    } catch (error) {
      console.error("❌ Error applying CSS background effect:", error);
    }
  }

  // Apply solid color background
  async applySolidColorBackground(color) {
    try {
      if (this.currentUserRole !== 1) {
        console.log("❌ Only presenters can change backgrounds");
        return;
      }

      console.log("🎨 Applying solid color background:", color);

      if (!this.client || !this.client.getMediaStream) {
        throw new Error("Media stream not available");
      }

      const mediaStream = this.client.getMediaStream();
      if (!mediaStream) {
        throw new Error("Media stream not initialized");
      }

      // Check if video is on
      const currentUser = this.client.getCurrentUserInfo();
      if (!currentUser || !currentUser.bVideoOn) {
        console.log("⚠️ Please start your video first");
        return;
      }

      // Set flag to prevent duplicate video rendering during background change
      this.isChangingBackground = true;

      // Create SVG background for the color
      const svgBackground = `data:image/svg+xml;base64,${btoa(`
        <svg width="1920" height="1080" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${color}"/>
        </svg>
      `)}`;

      // Apply solid color background using Zoom's built-in feature
      await mediaStream.stopVideo();
      await new Promise((resolve) => setTimeout(resolve, 100)); // Buffer time

      await mediaStream.startVideo({
        virtualBackground: {
          imageUrl: svgBackground,
        },
      });

      this.currentBackground = "solid";
      this.customBackgroundImage = svgBackground;
      console.log("✅ Solid color background applied via Zoom SDK");

      // Reset flag after background change and cleanup duplicates
      setTimeout(() => {
        this.isChangingBackground = false;
        console.log(
          "🔄 Background change completed, video rendering re-enabled"
        );
        this.cleanupDuplicateVideos(); // Clean up any duplicate videos
      }, 1000);
    } catch (error) {
      console.error("❌ Error applying solid color background:", error);
      console.log("💡 Falling back to CSS-based solid background");

      // Fallback to CSS-based approach
      this.applyCSSBackgroundEffect("solid", color);
      this.currentBackground = "solid";

      // Reset flag on error
      this.isChangingBackground = false;
    }
  }

  // Clean up duplicate video elements after background change
  cleanupDuplicateVideos() {
    try {
      console.log("🧹 Cleaning up duplicate video elements");

      // Remove ALL video elements and re-render them cleanly
      const videoItems = document.querySelectorAll(".video-item");
      console.log(`🗑️ Removing ${videoItems.length} existing video elements`);

      videoItems.forEach((item) => {
        item.remove();
      });

      // Clear participants map to force fresh rendering
      this.participants.clear();
      console.log("🧹 Cleared participants map");

      // Re-render videos after a short delay
      setTimeout(() => {
        console.log("🔄 Re-rendering videos after cleanup");
        this.renderAllVideos();
      }, 500);
    } catch (error) {
      console.error("❌ Error cleaning up duplicate videos:", error);
    }
  }

  // Re-render all videos after background change
  async renderAllVideos() {
    try {
      console.log("🎥 Re-rendering all videos after background change");

      if (!this.client) {
        console.log("⚠️ Client not available for re-rendering");
        return;
      }

      // Get all users and render their videos
      const allUsers = this.client.getAllUser();
      console.log(`👥 Re-rendering videos for ${allUsers.length} users`);

      for (const user of allUsers) {
        if (user.bVideoOn) {
          console.log(
            `🎥 Re-rendering video for user: ${user.userName} (${user.userId})`
          );

          // Add user to participants map
          this.participants.set(user.userId, {
            userId: user.userId,
            userName: user.userName || `User ${user.userId}`,
            element: null,
          });

          // Render video
          if (user.userId === this.client.getCurrentUserInfo()?.userId) {
            // Local user
            await this.renderLocalVideo();
          } else {
            // Remote user
            await this.renderParticipantVideo(user.userId);
          }
        }
      }

      console.log("✅ All videos re-rendered successfully");
    } catch (error) {
      console.error("❌ Error re-rendering videos:", error);
    }
  }

  // Disable video event listeners during background change
  disableVideoEventListeners() {
    try {
      console.log(
        "🚫 Disabling video event listeners during background change"
      );
      this.videoEventListenersDisabled = true;

      // Remove event listeners from client
      if (this.client) {
        this.client.off("peer-video-state-change");
        this.client.off("peer-audio-state-change");
        console.log("✅ Video event listeners disabled");
      }

      // Also add a global flag to prevent any video operations
      window.__VIDEO_EVENTS_DISABLED__ = true;
      console.log("🚫 Global video events disabled");
    } catch (error) {
      console.error("❌ Error disabling video event listeners:", error);
    }
  }

  // Re-enable video event listeners after background change
  reEnableVideoEventListeners() {
    try {
      console.log(
        "✅ Re-enabling video event listeners after background change"
      );
      this.videoEventListenersDisabled = false;

      // Remove global flag
      window.__VIDEO_EVENTS_DISABLED__ = false;
      console.log("✅ Global video events re-enabled");

      // Re-attach event listeners
      if (this.client) {
        this.setupZoomEventListeners();
        console.log("✅ Video event listeners re-enabled");
      }
    } catch (error) {
      console.error("❌ Error re-enabling video event listeners:", error);
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new VideoCallApp();
});
