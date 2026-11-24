"""Build the program-specific campus cards consumed by the TypeScript game."""
import argparse
import json
from pathlib import Path

OUTPUT = Path(__file__).resolve().parents[1] / "src" / "studios.json"
# Fictional campus activities inspired by the subjects in the Waterloo program guide.
# Each entry pairs an E7 team project with a lower-stress DC study session.
STUDIOS = {
    "software": ("Test the timetable app", "Trace a timetable clash through the team's regression tests.", "Sketch an undo stack", "Work out what the editor needs to remember after each change."),
    "computer": ("Wire the scoreboard", "Link the display board to its controller and check each digit.", "Map a cache miss", "Follow a memory request from a processor to RAM."),
    "electrical": ("Tune the audio filter", "Compare the bench output with the frequency response you predicted.", "Trace the circuit", "Check where the voltage drops in a resistive network."),
    "mechanical": ("Test a gearbox", "Measure how much torque makes it through the model drivetrain.", "Compare beam deflections", "Sketch how a shelf bends under three different loads."),
    "mechatronics": ("Tune the line follower", "Adjust the controller until the team's rover takes a bend cleanly.", "Plot the sensor drift", "Use a calibration log to separate bias from noise."),
    "biomedical": ("Mock up a grip aid", "Compare two handle shapes using a weighted classroom model.", "Map a clinic visit", "Spot where a device interface asks too much of its user."),
    "systems": ("Test a wayfinding sign", "Watch how volunteers use two layouts to find a studio.", "Map the bus queue", "Model how a late bus changes the length of the next queue."),
    "chemical": ("Model a juice line", "Balance material flows across a small fictional bottling plant.", "Trace a heat exchanger", "Follow two streams of water as they exchange heat."),
    "civil": ("Load the model span", "Watch how a scale bridge transfers weight to its supports.", "Sketch a transit corridor", "Trace how a bus lane would change the morning commute."),
    "architectural": ("Build a facade model", "Compare how two mock-ups shade the same studio window.", "Check a wall section", "Sketch where heat escapes through a window assembly."),
    "management": ("Run a queue experiment", "Change the service order and measure the wait at a mock counter.", "Schedule the shop floor", "Fit three jobs around one shared machine."),
    "geological": ("Read a core log", "Use a classroom sample log to mark the rock layers under a site.", "Map a slope section", "Compare two profiles and trace the path of groundwater."),
    "environmental": ("Model a treatment train", "Trace water through a tabletop model of a treatment plant.", "Read the watershed map", "Follow rain from a parking lot to the nearest creek."),
    "nano": ("Inspect a wafer image", "Compare patterned features across a set of supplied microscope images.", "Chart the thin films", "Plot film thickness against a sample's measured resistance."),
}


def cards():
    deck = []
    for program, (project, brief, study, question) in STUDIOS.items():
        for location, title, description in (("e7", project, brief), ("dana", study, question)):
            deck.append(dict(program=program, location=location, name=title, description=description,
                             id=f"studio-{program}-{location}"))
    return deck


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Check the committed browser catalog")
    args = parser.parse_args()
    content = json.dumps(cards(), ensure_ascii=False, indent=2) + "\n"
    if args.check:
        if not OUTPUT.exists() or OUTPUT.read_text(encoding="utf-8") != content:
            raise SystemExit("Studio catalog is stale. Run python tools/studios.py.")
    else:
        OUTPUT.write_text(content, encoding="utf-8")


if __name__ == "__main__":
    main()
