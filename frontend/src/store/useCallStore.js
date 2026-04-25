import { create } from "zustand";

export const useCallStore = create((set) => ({
  callActive: false,
  minimized: false,
  maximized: false,
  
  // Call Context (Target channel for the active call)
  callCommunityId: null,
  callChannelId: null,

  // Media Streams
  localStreams: [],
  remoteAudioStreams: [],
  screenShareToggle: false,
  remoteVideoStreams: [],
  // UI Actions
  startCall: (communityId, channelId) => set({ 
    callActive: true, 
    minimized: false, 
    maximized: false,
    callCommunityId: communityId,
    callChannelId: channelId
  }),
  endCall: () => set({ 
    callActive: false, 
    minimized: false, 
    maximized: false,
    callCommunityId: null,
    callChannelId: null,
    localStreams: [],
    remoteVideoStreams: [],
    remoteAudioStreams: []
  }),

  minimize: () => set({ minimized: true, maximized: false }),
  maximize: () => set({ maximized: true, minimized: false }),
  restore: () => set({ minimized: false, maximized: false }),

  // Stream Setters
  setLocalStreams: (streams) => set({ localStreams: streams }),
  setRemoteVideoStreams: (streams) => set({ remoteVideoStreams: streams }),
  setRemoteAudioStreams: (streams) => set({ remoteAudioStreams: streams }),
  setScreenShareToggle: (toggle) => set({ screenShareToggle: toggle }),
}));
